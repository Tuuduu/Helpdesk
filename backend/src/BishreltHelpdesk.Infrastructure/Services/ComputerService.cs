using System.Text.RegularExpressions;
using BishreltHelpdesk.Application.DTOs.Common;
using BishreltHelpdesk.Application.DTOs.Computers;
using BishreltHelpdesk.Application.Interfaces;
using BishreltHelpdesk.Domain.Entities;
using BishreltHelpdesk.Domain.Enums;
using BishreltHelpdesk.Domain.Exceptions;
using BishreltHelpdesk.Domain.Interfaces;
using BishreltHelpdesk.Domain.Interfaces.Repositories;
using BishreltHelpdesk.Infrastructure.Data;
using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;

namespace BishreltHelpdesk.Infrastructure.Services;

public class ComputerService : IComputerService
{
    private static readonly Regex MacAddressRegex =
        new("^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$", RegexOptions.Compiled);

    private readonly IComputerRepository _computerRepository;
    private readonly IUserRepository _userRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly IFileStorageService _fileStorage;
    private readonly AppDbContext _context;

    public ComputerService(
        IComputerRepository computerRepository,
        IUserRepository userRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUser,
        IFileStorageService fileStorage,
        AppDbContext context)
    {
        _computerRepository = computerRepository;
        _userRepository = userRepository;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _fileStorage = fileStorage;
        _context = context;
    }

    public async Task<ComputerResponse> CreateAsync(CreateComputerRequest request)
    {
        ValidateRequest(request.Brand, request.Model, request.Cpu, request.RamGb,
            request.Position, request.Storages, request.MacAddresses);

        var owner = await _userRepository.GetByIdAsync(request.OwnerUserId)
            ?? throw new NotFoundException("Эзэмшигч хэрэглэгч олдсонгүй");

        var company = await _context.Companies.FindAsync(request.CompanyId)
            ?? throw new NotFoundException("Компани олдсонгүй");

        if (owner.CompanyId != request.CompanyId)
            throw new BadRequestException("Эзэмшигч хэрэглэгч сонгосон компанид харьяалагдахгүй байна");

        EnsureCompanyAccess(request.CompanyId);

        var macEntries = await PrepareMacEntriesAsync(request.MacAddresses, excludeComputerId: null);

        var assetCode = await _computerRepository.GenerateAssetCodeAsync();

        var computer = new Computer
        {
            Id = Guid.NewGuid(),
            AssetCode = assetCode,
            Kind = request.Kind,
            Brand = request.Brand.Trim(),
            Model = request.Model.Trim(),
            Monitor = request.Monitor?.Trim(),
            Cpu = request.Cpu.Trim(),
            RamGb = request.RamGb,
            Gpu = request.Gpu?.Trim(),
            DomainName = request.DomainName?.Trim(),
            OwnerUserId = request.OwnerUserId,
            Position = request.Position.Trim(),
            Department = string.IsNullOrWhiteSpace(request.Department) ? null : request.Department.Trim(),
            CompanyId = request.CompanyId,
            Status = ComputerStatus.Active
        };

        foreach (var s in request.Storages)
        {
            computer.Storages.Add(new ComputerStorage
            {
                Id = Guid.NewGuid(),
                Type = s.Type,
                CapacityGb = s.CapacityGb,
                ModelName = s.ModelName?.Trim()
            });
        }

        foreach (var m in macEntries)
        {
            m.ComputerId = computer.Id;
            computer.MacAddresses.Add(m);
        }

        foreach (var a in request.Accessories ?? new())
        {
            if (string.IsNullOrWhiteSpace(a.Name)) continue;
            computer.Accessories.Add(new ComputerAccessory
            {
                Id = Guid.NewGuid(),
                Name = a.Name.Trim(),
                Note = string.IsNullOrWhiteSpace(a.Note) ? null : a.Note.Trim()
            });
        }

        await _computerRepository.AddAsync(computer);
        await _unitOfWork.SaveChangesAsync();

        return await GetByIdAsync(computer.Id);
    }

    public async Task<ComputerResponse> UpdateAsync(Guid id, UpdateComputerRequest request)
    {
        ValidateRequest(request.Brand, request.Model, request.Cpu, request.RamGb,
            request.Position, request.Storages, request.MacAddresses);

        // Хүүхэд collection-уудыг include хийхгүй ачаална. Доор raw SQL DELETE-аар цэвэрлэж
        // дараа нь шинэ INSERT-уудыг хийнэ — change tracker зөрчилдөөн үүсгэхгүй.
        var computer = await _context.Computers
            .Include(c => c.Owner)
            .Include(c => c.Company)
            .FirstOrDefaultAsync(c => c.Id == id)
            ?? throw new NotFoundException("Компьютер олдсонгүй");

        EnsureCompanyAccess(computer.CompanyId);

        var newMacEntries = await PrepareMacEntriesAsync(request.MacAddresses, excludeComputerId: id);

        computer.Kind = request.Kind;
        computer.Brand = request.Brand.Trim();
        computer.Model = request.Model.Trim();
        computer.Monitor = request.Monitor?.Trim();
        computer.Cpu = request.Cpu.Trim();
        computer.RamGb = request.RamGb;
        computer.Gpu = request.Gpu?.Trim();
        computer.DomainName = request.DomainName?.Trim();
        computer.Position = request.Position.Trim();
        computer.Department = string.IsNullOrWhiteSpace(request.Department) ? null : request.Department.Trim();
        computer.Status = request.Status;

        // Хуучин хүүхдүүдийг raw SQL-аар цэвэрлэх
        await _context.ComputerStorages.Where(s => s.ComputerId == id).ExecuteDeleteAsync();
        await _context.ComputerMacAddresses.Where(m => m.ComputerId == id).ExecuteDeleteAsync();
        await _context.ComputerAccessories.Where(a => a.ComputerId == id).ExecuteDeleteAsync();

        // Шинэ хүүхдүүд
        foreach (var s in request.Storages)
        {
            await _context.ComputerStorages.AddAsync(new ComputerStorage
            {
                Id = Guid.NewGuid(),
                ComputerId = computer.Id,
                Type = s.Type,
                CapacityGb = s.CapacityGb,
                ModelName = s.ModelName?.Trim()
            });
        }

        foreach (var m in newMacEntries)
        {
            m.ComputerId = computer.Id;
            await _context.ComputerMacAddresses.AddAsync(m);
        }

        foreach (var a in request.Accessories ?? new())
        {
            if (string.IsNullOrWhiteSpace(a.Name)) continue;
            await _context.ComputerAccessories.AddAsync(new ComputerAccessory
            {
                Id = Guid.NewGuid(),
                ComputerId = computer.Id,
                Name = a.Name.Trim(),
                Note = string.IsNullOrWhiteSpace(a.Note) ? null : a.Note.Trim()
            });
        }

        await _unitOfWork.SaveChangesAsync();
        return await GetByIdAsync(computer.Id);
    }

    public async Task<ComputerResponse> GetByIdAsync(Guid id)
    {
        var computer = await _computerRepository.GetWithDetailsAsync(id)
            ?? throw new NotFoundException("Компьютер олдсонгүй");

        EnsureCanRead(computer);

        return MapToResponse(computer);
    }

    public async Task<PagedResult<ComputerListItem>> GetListAsync(ComputerFilterRequest filter)
    {
        var query = _computerRepository.QueryWithIncludes();

        if (_currentUser.Role != UserRole.SuperAdmin && _currentUser.Role != UserRole.Admin && _currentUser.CompanyId.HasValue)
            query = query.Where(c => c.CompanyId == _currentUser.CompanyId.Value);
        else if (filter.CompanyId.HasValue)
            query = query.Where(c => c.CompanyId == filter.CompanyId.Value);

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var search = filter.Search.Trim().ToLower();
            query = query.Where(c =>
                c.AssetCode.ToLower().Contains(search) ||
                c.Brand.ToLower().Contains(search) ||
                c.Model.ToLower().Contains(search) ||
                (c.DomainName != null && c.DomainName.ToLower().Contains(search)) ||
                c.MacAddresses.Any(m => m.Address.ToLower().Contains(search)) ||
                c.Owner.FullName.ToLower().Contains(search));
        }

        if (filter.Status.HasValue)
            query = query.Where(c => c.Status == filter.Status.Value);

        if (filter.OwnerUserId.HasValue)
            query = query.Where(c => c.OwnerUserId == filter.OwnerUserId.Value);

        if (!string.IsNullOrWhiteSpace(filter.Brand))
        {
            var brand = filter.Brand.Trim().ToLower();
            query = query.Where(c => c.Brand.ToLower() == brand);
        }

        query = filter.SortBy?.ToLower() switch
        {
            "assetcode" => filter.SortDescending
                ? query.OrderByDescending(c => c.AssetCode)
                : query.OrderBy(c => c.AssetCode),
            "brand" => filter.SortDescending
                ? query.OrderByDescending(c => c.Brand)
                : query.OrderBy(c => c.Brand),
            "status" => filter.SortDescending
                ? query.OrderByDescending(c => c.Status)
                : query.OrderBy(c => c.Status),
            _ => filter.SortDescending
                ? query.OrderByDescending(c => c.CreatedAt)
                : query.OrderBy(c => c.CreatedAt)
        };

        var totalCount = await query.CountAsync();

        var items = await query
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(c => new ComputerListItem
            {
                Id = c.Id,
                AssetCode = c.AssetCode,
                Kind = c.Kind.ToString(),
                Brand = c.Brand,
                Model = c.Model,
                Cpu = c.Cpu,
                RamGb = c.RamGb,
                MacAddress = c.MacAddresses.Where(m => m.IsPrimary).Select(m => m.Address).FirstOrDefault()
                    ?? c.MacAddresses.Select(m => m.Address).FirstOrDefault()
                    ?? "",
                DomainName = c.DomainName,
                OwnerName = c.Owner.FullName,
                Position = c.Position,
                CompanyName = c.Company.Name,
                Status = c.Status.ToString(),
                PrimaryImageUrl = c.Images.Where(i => i.IsPrimary).Select(i => i.ImageUrl).FirstOrDefault()
                    ?? c.Images.Select(i => i.ImageUrl).FirstOrDefault(),
                CreatedAt = c.CreatedAt
            })
            .ToListAsync();

        return new PagedResult<ComputerListItem>
        {
            Items = items,
            TotalCount = totalCount,
            Page = filter.Page,
            PageSize = filter.PageSize
        };
    }

    public async Task<List<ComputerListItem>> GetMyComputersAsync()
    {
        var userId = _currentUser.UserId
            ?? throw new ForbiddenException("Нэвтрэх шаардлагатай");

        return await _computerRepository.QueryWithIncludes()
            .Where(c => c.OwnerUserId == userId)
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new ComputerListItem
            {
                Id = c.Id,
                AssetCode = c.AssetCode,
                Kind = c.Kind.ToString(),
                Brand = c.Brand,
                Model = c.Model,
                Cpu = c.Cpu,
                RamGb = c.RamGb,
                MacAddress = c.MacAddresses.Where(m => m.IsPrimary).Select(m => m.Address).FirstOrDefault()
                    ?? c.MacAddresses.Select(m => m.Address).FirstOrDefault()
                    ?? "",
                DomainName = c.DomainName,
                OwnerName = c.Owner.FullName,
                Position = c.Position,
                CompanyName = c.Company.Name,
                Status = c.Status.ToString(),
                PrimaryImageUrl = c.Images.Where(i => i.IsPrimary).Select(i => i.ImageUrl).FirstOrDefault()
                    ?? c.Images.Select(i => i.ImageUrl).FirstOrDefault(),
                CreatedAt = c.CreatedAt
            })
            .ToListAsync();
    }

    public async Task DeleteAsync(Guid id)
    {
        var computer = await _computerRepository.GetWithDetailsAsync(id)
            ?? throw new NotFoundException("Компьютер олдсонгүй");

        var imagePaths = computer.Images.Select(i => i.ImageUrl).ToList();

        _computerRepository.Delete(computer);
        await _unitOfWork.SaveChangesAsync();

        foreach (var url in imagePaths)
            await _fileStorage.DeleteAsync(url);
    }

    public async Task<ComputerImageDto> UploadImageAsync(Guid computerId, UploadFileInput file, bool isPrimary)
    {
        var computer = await _computerRepository.GetWithDetailsAsync(computerId)
            ?? throw new NotFoundException("Компьютер олдсонгүй");

        EnsureCompanyAccess(computer.CompanyId);

        var url = await _fileStorage.SaveImageAsync(file, "computers");

        if (isPrimary)
        {
            foreach (var existing in computer.Images)
                existing.IsPrimary = false;
        }

        var image = new ComputerImage
        {
            Id = Guid.NewGuid(),
            ComputerId = computerId,
            ImageUrl = url,
            IsPrimary = isPrimary || !computer.Images.Any(),
            UploadedAt = DateTime.UtcNow
        };

        await _context.ComputerImages.AddAsync(image);
        await _unitOfWork.SaveChangesAsync();

        return new ComputerImageDto
        {
            Id = image.Id,
            ImageUrl = image.ImageUrl,
            IsPrimary = image.IsPrimary,
            UploadedAt = image.UploadedAt
        };
    }

    public async Task DeleteImageAsync(Guid computerId, Guid imageId)
    {
        var computer = await _computerRepository.GetWithDetailsAsync(computerId)
            ?? throw new NotFoundException("Компьютер олдсонгүй");

        EnsureCompanyAccess(computer.CompanyId);

        var image = computer.Images.FirstOrDefault(i => i.Id == imageId)
            ?? throw new NotFoundException("Зураг олдсонгүй");

        _context.ComputerImages.Remove(image);
        await _unitOfWork.SaveChangesAsync();

        await _fileStorage.DeleteAsync(image.ImageUrl);
    }

    public async Task<ComputerDashboardResponse> GetDashboardAsync()
    {
        var query = _context.Computers.AsQueryable();

        if (_currentUser.Role != UserRole.SuperAdmin && _currentUser.Role != UserRole.Admin && _currentUser.CompanyId.HasValue)
            query = query.Where(c => c.CompanyId == _currentUser.CompanyId.Value);

        var statusGroups = await query
            .GroupBy(c => c.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync();

        var totalCount = statusGroups.Sum(g => g.Count);
        var now = DateTime.UtcNow;

        double avgRam = 0;
        double avgAgeDays = 0;
        if (totalCount > 0)
        {
            avgRam = await query.AverageAsync(c => (double)c.RamGb);
            var createdDates = await query.Select(c => c.CreatedAt).ToListAsync();
            avgAgeDays = createdDates.Average(d => (now - d).TotalDays);
        }

        var thirtyDaysAgo = now.AddDays(-30);
        var transferQuery = _context.ComputerTransferHistories
            .Where(h => h.TransferredAt >= thirtyDaysAgo);
        if (_currentUser.Role != UserRole.SuperAdmin && _currentUser.Role != UserRole.Admin && _currentUser.CompanyId.HasValue)
            transferQuery = transferQuery.Where(h => h.Computer.CompanyId == _currentUser.CompanyId.Value);
        var transfersLast30 = await transferQuery.CountAsync();

        var byCompany = await query
            .GroupBy(c => c.Company.Name)
            .Select(g => new NameCountPair { Name = g.Key, Count = g.Count() })
            .OrderByDescending(p => p.Count)
            .ToListAsync();

        var byBrand = await query
            .GroupBy(c => c.Brand)
            .Select(g => new NameCountPair { Name = g.Key, Count = g.Count() })
            .OrderByDescending(p => p.Count)
            .ToListAsync();

        return new ComputerDashboardResponse
        {
            TotalCount = totalCount,
            ActiveCount = statusGroups.FirstOrDefault(g => g.Status == ComputerStatus.Active)?.Count ?? 0,
            InRepairCount = statusGroups.FirstOrDefault(g => g.Status == ComputerStatus.InRepair)?.Count ?? 0,
            InTransferCount = statusGroups.FirstOrDefault(g => g.Status == ComputerStatus.InTransfer)?.Count ?? 0,
            RetiredCount = statusGroups.FirstOrDefault(g => g.Status == ComputerStatus.Retired)?.Count ?? 0,
            AverageRamGb = Math.Round(avgRam, 1),
            AverageAgeDays = Math.Round(avgAgeDays, 1),
            TransfersLast30Days = transfersLast30,
            ByCompany = byCompany,
            ByBrand = byBrand
        };
    }

    public async Task<ComputerReportSummary> GetReportAsync(ComputerReportFilterRequest filter)
    {
        var rows = await BuildReportRowsAsync(filter);

        var avgRam = rows.Count > 0 ? rows.Average(r => (double)r.RamGb) : 0;
        var now = DateTime.UtcNow;
        var avgAge = rows.Count > 0
            ? rows.Average(r => (now - r.CreatedAt).TotalDays)
            : 0;

        return new ComputerReportSummary
        {
            TotalCount = rows.Count,
            ActiveCount = rows.Count(r => r.Status == ComputerStatus.Active.ToString()),
            InRepairCount = rows.Count(r => r.Status == ComputerStatus.InRepair.ToString()),
            InTransferCount = rows.Count(r => r.Status == ComputerStatus.InTransfer.ToString()),
            RetiredCount = rows.Count(r => r.Status == ComputerStatus.Retired.ToString()),
            AverageRamGb = Math.Round(avgRam, 1),
            AverageAgeDays = Math.Round(avgAge, 1),
            Rows = rows
        };
    }

    public async Task<byte[]> ExportReportAsync(ComputerReportFilterRequest filter)
    {
        var rows = await BuildReportRowsAsync(filter);

        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Компьютерийн тайлан");

        var headers = new[]
        {
            "Хөрөнгийн код", "Төрөл", "Брэнд", "Загвар", "Дэлгэц",
            "CPU", "RAM (GB)", "GPU", "Storage", "MAC хаягууд",
            "Домайн", "Эзэмшигч", "Албан тушаал", "Хэлтэс",
            "Компани", "Дагалдах хэрэгсэл", "Төлөв", "Бүртгэсэн огноо"
        };

        for (int i = 0; i < headers.Length; i++)
        {
            var cell = ws.Cell(1, i + 1);
            cell.Value = headers[i];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#2D2C70");
            cell.Style.Font.FontColor = XLColor.White;
            cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        }

        for (int i = 0; i < rows.Count; i++)
        {
            var r = rows[i];
            var rowNum = i + 2;
            ws.Cell(rowNum, 1).Value = r.AssetCode;
            ws.Cell(rowNum, 2).Value = r.Kind == "Laptop" ? "Зөөврийн" : "Суурин";
            ws.Cell(rowNum, 3).Value = r.Brand;
            ws.Cell(rowNum, 4).Value = r.Model;
            ws.Cell(rowNum, 5).Value = r.Monitor ?? "";
            ws.Cell(rowNum, 6).Value = r.Cpu;
            ws.Cell(rowNum, 7).Value = r.RamGb;
            ws.Cell(rowNum, 8).Value = r.Gpu ?? "";
            ws.Cell(rowNum, 9).Value = r.Storages;
            ws.Cell(rowNum, 10).Value = r.MacAddress;
            ws.Cell(rowNum, 11).Value = r.DomainName ?? "";
            ws.Cell(rowNum, 12).Value = r.OwnerName;
            ws.Cell(rowNum, 13).Value = r.Position;
            ws.Cell(rowNum, 14).Value = r.Department ?? "";
            ws.Cell(rowNum, 15).Value = r.CompanyName;
            ws.Cell(rowNum, 16).Value = r.Accessories;
            ws.Cell(rowNum, 17).Value = r.Status;
            ws.Cell(rowNum, 18).Value = r.CreatedAt.ToString("yyyy-MM-dd");
        }

        ws.Columns().AdjustToContents();
        ws.SheetView.FreezeRows(1);

        var summaryStart = rows.Count + 3;
        ws.Cell(summaryStart, 1).Value = "Нийт:";
        ws.Cell(summaryStart, 1).Style.Font.Bold = true;
        ws.Cell(summaryStart, 2).Value = rows.Count;
        ws.Cell(summaryStart + 1, 1).Value = "Идэвхтэй:";
        ws.Cell(summaryStart + 1, 2).Value = rows.Count(r => r.Status == ComputerStatus.Active.ToString());
        ws.Cell(summaryStart + 2, 1).Value = "Засварт:";
        ws.Cell(summaryStart + 2, 2).Value = rows.Count(r => r.Status == ComputerStatus.InRepair.ToString());
        ws.Cell(summaryStart + 3, 1).Value = "Шилжиж буй:";
        ws.Cell(summaryStart + 3, 2).Value = rows.Count(r => r.Status == ComputerStatus.InTransfer.ToString());
        ws.Cell(summaryStart + 4, 1).Value = "Хасагдсан:";
        ws.Cell(summaryStart + 4, 2).Value = rows.Count(r => r.Status == ComputerStatus.Retired.ToString());
        ws.Cell(summaryStart + 5, 1).Value = "Суурин:";
        ws.Cell(summaryStart + 5, 2).Value = rows.Count(r => r.Kind == "Desktop");
        ws.Cell(summaryStart + 6, 1).Value = "Зөөврийн:";
        ws.Cell(summaryStart + 6, 2).Value = rows.Count(r => r.Kind == "Laptop");

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    private async Task<List<ComputerReportRow>> BuildReportRowsAsync(ComputerReportFilterRequest filter)
    {
        var query = _context.Computers
            .Include(c => c.Owner)
            .Include(c => c.Company)
            .Include(c => c.Storages)
            .Include(c => c.MacAddresses)
            .Include(c => c.Accessories)
            .AsQueryable();

        if (_currentUser.Role != UserRole.SuperAdmin && _currentUser.Role != UserRole.Admin && _currentUser.CompanyId.HasValue)
            query = query.Where(c => c.CompanyId == _currentUser.CompanyId.Value);
        else if (filter.CompanyId.HasValue)
            query = query.Where(c => c.CompanyId == filter.CompanyId.Value);

        if (filter.Status.HasValue)
            query = query.Where(c => c.Status == filter.Status.Value);

        if (filter.Kind.HasValue)
            query = query.Where(c => c.Kind == filter.Kind.Value);

        if (!string.IsNullOrWhiteSpace(filter.Brand))
        {
            var brand = filter.Brand.Trim().ToLower();
            query = query.Where(c => c.Brand.ToLower() == brand);
        }

        if (!string.IsNullOrWhiteSpace(filter.Department))
        {
            var dept = filter.Department.Trim().ToLower();
            query = query.Where(c => c.Department != null && c.Department.ToLower() == dept);
        }

        if (filter.DateFrom.HasValue)
            query = query.Where(c => c.CreatedAt >= filter.DateFrom.Value);

        if (filter.DateTo.HasValue)
            query = query.Where(c => c.CreatedAt <= filter.DateTo.Value);

        var computers = await query.OrderBy(c => c.AssetCode).ToListAsync();

        return computers.Select(c => new ComputerReportRow
        {
            AssetCode = c.AssetCode,
            Kind = c.Kind.ToString(),
            Brand = c.Brand,
            Model = c.Model,
            Monitor = c.Monitor,
            Cpu = c.Cpu,
            RamGb = c.RamGb,
            Gpu = c.Gpu,
            Storages = string.Join(", ",
                c.Storages.OrderBy(s => s.Type)
                    .Select(s => $"{s.Type} {s.CapacityGb}GB")),
            MacAddress = string.Join(", ",
                c.MacAddresses
                    .OrderByDescending(m => m.IsPrimary)
                    .ThenBy(m => m.Type)
                    .Select(m => $"{m.Type}: {m.Address}")),
            DomainName = c.DomainName,
            OwnerName = c.Owner?.FullName ?? "—",
            Position = c.Position,
            Department = c.Department,
            CompanyName = c.Company?.Name ?? "—",
            Accessories = string.Join(", ",
                c.Accessories
                    .OrderBy(a => a.Name)
                    .Select(a => string.IsNullOrWhiteSpace(a.Note)
                        ? a.Name
                        : $"{a.Name} ({a.Note})")),
            Status = c.Status.ToString(),
            CreatedAt = c.CreatedAt
        }).ToList();
    }

    // ─────────── helpers ───────────

    private async Task<List<ComputerMacAddress>> PrepareMacEntriesAsync(
        List<ComputerMacAddressInput> inputs,
        Guid? excludeComputerId)
    {
        var entries = new List<ComputerMacAddress>();
        var normalizedSet = new HashSet<string>();

        foreach (var input in inputs)
        {
            if (string.IsNullOrWhiteSpace(input.Address))
                throw new BadRequestException("MAC хаягийг хоосон үлдээх боломжгүй");

            if (!MacAddressRegex.IsMatch(input.Address))
                throw new BadRequestException(
                    $"MAC хаягийн формат буруу байна: '{input.Address}' (XX:XX:XX:XX:XX:XX)");

            var normalized = NormalizeMac(input.Address);

            if (!normalizedSet.Add(normalized))
                throw new BadRequestException($"Давхардсан MAC хаяг: '{normalized}'");

            if (await _computerRepository.MacAddressInUseAsync(normalized, excludeComputerId))
                throw new BadRequestException(
                    $"MAC хаяг '{normalized}' өөр компьютер дээр бүртгэгдсэн байна");

            entries.Add(new ComputerMacAddress
            {
                Id = Guid.NewGuid(),
                Type = input.Type,
                Address = normalized,
                Label = string.IsNullOrWhiteSpace(input.Label) ? null : input.Label.Trim(),
                IsPrimary = input.IsPrimary
            });
        }

        // Ensure exactly one IsPrimary (first one if none flagged)
        if (!entries.Any(e => e.IsPrimary))
            entries[0].IsPrimary = true;
        else
        {
            var first = true;
            foreach (var e in entries)
            {
                if (e.IsPrimary)
                {
                    if (!first) e.IsPrimary = false;
                    first = false;
                }
            }
            // Re-find: if multiple were flagged, only the first remains
            if (!entries.Any(e => e.IsPrimary))
                entries[0].IsPrimary = true;
        }

        return entries;
    }

    private void EnsureCanRead(Computer computer)
    {
        if (_currentUser.Role == UserRole.SuperAdmin) return;
        if (_currentUser.Role == UserRole.Admin) return;

        if (_currentUser.Role == UserRole.ITStorekeeper)
        {
            if (_currentUser.CompanyId == computer.CompanyId) return;
            throw new ForbiddenException("Энэ компьютерт хандах эрхгүй байна");
        }

        if (_currentUser.UserId == computer.OwnerUserId) return;

        throw new ForbiddenException("Энэ компьютерт хандах эрхгүй байна");
    }

    private void EnsureCompanyAccess(Guid companyId)
    {
        if (_currentUser.Role == UserRole.SuperAdmin) return;

        if (_currentUser.CompanyId != companyId)
            throw new ForbiddenException("Энэ компанид хандах эрхгүй байна");
    }

    private static void ValidateRequest(string brand, string model, string cpu, int ramGb,
        string position, List<ComputerStorageInput> storages, List<ComputerMacAddressInput> macs)
    {
        if (string.IsNullOrWhiteSpace(brand))
            throw new BadRequestException("Brand заавал бөглөнө");
        if (string.IsNullOrWhiteSpace(model))
            throw new BadRequestException("Model заавал бөглөнө");
        if (string.IsNullOrWhiteSpace(cpu))
            throw new BadRequestException("CPU заавал бөглөнө");
        if (ramGb <= 0)
            throw new BadRequestException("RAM хэмжээ 0-ээс их байх ёстой");
        if (string.IsNullOrWhiteSpace(position))
            throw new BadRequestException("Албан тушаал заавал бөглөнө");
        if (storages == null || storages.Count == 0)
            throw new BadRequestException("Дор хаяж нэг storage оруулна уу");
        foreach (var s in storages)
        {
            if (s.CapacityGb <= 0)
                throw new BadRequestException("Storage багтаамж 0-ээс их байх ёстой");
        }
        if (macs == null || macs.Count == 0)
            throw new BadRequestException("Дор хаяж нэг MAC хаяг оруулна уу");
    }

    private static string NormalizeMac(string mac) => mac.Trim().ToUpperInvariant().Replace('-', ':');

    private static ComputerResponse MapToResponse(Computer c)
    {
        var primaryMac = c.MacAddresses.FirstOrDefault(m => m.IsPrimary)
            ?? c.MacAddresses.FirstOrDefault();

        return new ComputerResponse
        {
            Id = c.Id,
            AssetCode = c.AssetCode,
            Kind = c.Kind.ToString(),
            Brand = c.Brand,
            Model = c.Model,
            Monitor = c.Monitor,
            Cpu = c.Cpu,
            RamGb = c.RamGb,
            Gpu = c.Gpu,
            MacAddress = primaryMac?.Address ?? "",
            DomainName = c.DomainName,
            OwnerUserId = c.OwnerUserId,
            OwnerName = c.Owner?.FullName ?? "",
            Position = c.Position,
            Department = c.Department,
            CompanyId = c.CompanyId,
            CompanyName = c.Company?.Name ?? "",
            Status = c.Status.ToString(),
            PrimaryImageUrl = c.Images.FirstOrDefault(i => i.IsPrimary)?.ImageUrl
                ?? c.Images.FirstOrDefault()?.ImageUrl,
            CreatedAt = c.CreatedAt,
            UpdatedAt = c.UpdatedAt,
            Storages = c.Storages.Select(s => new ComputerStorageDto
            {
                Id = s.Id,
                Type = s.Type.ToString(),
                CapacityGb = s.CapacityGb,
                ModelName = s.ModelName
            }).ToList(),
            Images = c.Images.Select(i => new ComputerImageDto
            {
                Id = i.Id,
                ImageUrl = i.ImageUrl,
                IsPrimary = i.IsPrimary,
                UploadedAt = i.UploadedAt
            }).ToList(),
            MacAddresses = c.MacAddresses
                .OrderByDescending(m => m.IsPrimary)
                .ThenBy(m => m.Type)
                .Select(m => new ComputerMacAddressDto
                {
                    Id = m.Id,
                    Type = m.Type.ToString(),
                    Address = m.Address,
                    Label = m.Label,
                    IsPrimary = m.IsPrimary
                }).ToList(),
            Accessories = c.Accessories
                .OrderBy(a => a.Name)
                .Select(a => new ComputerAccessoryDto
                {
                    Id = a.Id,
                    Name = a.Name,
                    Note = a.Note
                }).ToList()
        };
    }
}
