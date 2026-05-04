using BishreltHelpdesk.Application.DTOs.ComputerProcesses;
using BishreltHelpdesk.Application.DTOs.ComputerTransfers;
using BishreltHelpdesk.Application.Interfaces;
using BishreltHelpdesk.Domain.Entities;
using BishreltHelpdesk.Domain.Enums;
using BishreltHelpdesk.Domain.Exceptions;
using BishreltHelpdesk.Domain.Interfaces;
using BishreltHelpdesk.Domain.Interfaces.Repositories;
using BishreltHelpdesk.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BishreltHelpdesk.Infrastructure.Services;

public class ComputerProcessService : IComputerProcessService
{
    private readonly AppDbContext _context;
    private readonly IComputerRepository _computerRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly INotificationService _notifications;
    private readonly ITransferWorkflowService _workflowService;

    public ComputerProcessService(
        AppDbContext context,
        IComputerRepository computerRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUser,
        INotificationService notifications,
        ITransferWorkflowService workflowService)
    {
        _context = context;
        _computerRepository = computerRepository;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _notifications = notifications;
        _workflowService = workflowService;
    }

    public async Task<ProcessRequestResponse> GetByIdAsync(Guid id)
    {
        var req = await LoadRequestAsync(id);

        var userId = _currentUser.UserId;
        var canSee =
            userId == req.RequestedByUserId
            || _currentUser.Role == UserRole.SuperAdmin
            || (_currentUser.Role == UserRole.Admin
                && _currentUser.CompanyId == req.Computer.CompanyId)
            || (userId.HasValue
                && await IsAnyStepApproverAsync(req.Computer.CompanyId, req.Type, userId.Value));

        if (!canSee)
            throw new ForbiddenException("Энэ хүсэлт дээр хандах эрхгүй байна");

        return await BuildResponseAsync(req);
    }

    public async Task<ProcessRequestResponse> CreateAsync(WorkflowType type, CreateProcessRequestRequest request)
    {
        var userId = _currentUser.UserId
            ?? throw new ForbiddenException("Нэвтрэх шаардлагатай");

        if (string.IsNullOrWhiteSpace(request.Description))
            throw new BadRequestException("Тайлбар заавал бөглөнө");

        var computer = await _computerRepository.GetWithDetailsAsync(request.ComputerId)
            ?? throw new NotFoundException("Компьютер олдсонгүй");

        if (computer.OwnerUserId != userId)
            throw new ForbiddenException("Зөвхөн өөрийн эзэмшилд байгаа компьютер дээр хүсэлт үүсгэх боломжтой");

        if (computer.Status != ComputerStatus.Active)
            throw new BadRequestException("Зөвхөн идэвхтэй (Active) төлөвт байгаа компьютер дээр хүсэлт үүсгэх боломжтой");

        var steps = await _workflowService.LoadStepsForCompanyAsync(computer.CompanyId, type);
        if (steps.Count == 0)
            throw new BadRequestException(
                $"Компанид '{LocalizedTypeName(type)}'-ын workflow тохируулаагүй байна. Эхлээд Тохиргоо хэсэгт workflow тохируулна уу.");

        var req = new ComputerProcessRequest
        {
            Id = Guid.NewGuid(),
            Type = type,
            ComputerId = computer.Id,
            RequestedByUserId = userId,
            Description = request.Description.Trim(),
            CurrentStepIndex = 0,
            Status = ProcessRequestStatus.PendingApproval
        };

        // Computer status өөрчлөгдөнө: Repair → InRepair, Retirement → InTransfer (interim)
        computer.Status = type == WorkflowType.Repair
            ? ComputerStatus.InRepair
            : ComputerStatus.InTransfer; // Акт хасагдалт явагдаж байгаа interim төлөв

        await _context.ComputerProcessRequests.AddAsync(req);
        await _unitOfWork.SaveChangesAsync();

        await NotifyStepApproversAsync(steps[0], req, computer);

        return await GetByIdAsync(req.Id);
    }

    public async Task<ProcessRequestResponse> ApproveCurrentStepAsync(Guid id, ProcessActionRequest request)
    {
        var userId = _currentUser.UserId
            ?? throw new ForbiddenException("Нэвтрэх шаардлагатай");

        var req = await LoadRequestAsync(id);
        if (req.Status != ProcessRequestStatus.PendingApproval)
            throw new BadRequestException("Энэ хүсэлт батлах төлөвт байхгүй байна");

        var steps = await _workflowService.LoadStepsForCompanyAsync(req.Computer.CompanyId, req.Type);
        if (req.CurrentStepIndex < 0 || req.CurrentStepIndex >= steps.Count)
            throw new BadRequestException("Workflow алхам алдаатай");

        var currentStep = steps[req.CurrentStepIndex];
        if (!currentStep.Approvers.Any(a => a.UserId == userId))
            throw new ForbiddenException("Та энэ алхмыг батлах эрхгүй байна");

        var approval = new ProcessStepApproval
        {
            Id = Guid.NewGuid(),
            ProcessRequestId = req.Id,
            StepOrder = currentStep.Order,
            ActedByUserId = userId,
            ActedAt = DateTime.UtcNow,
            IsApproval = true,
            Note = request.Note?.Trim()
        };
        await _context.ProcessStepApprovals.AddAsync(approval);

        var isLastStep = req.CurrentStepIndex >= steps.Count - 1;
        if (isLastStep)
        {
            // Эцсийн алхам — хүсэлт дууссан
            req.Status = ProcessRequestStatus.Completed;
            req.CompletedAt = DateTime.UtcNow;
            req.CompletionNote = request.Note?.Trim();

            // Computer-ийн төлөв шинэчлэх
            req.Computer.Status = req.Type == WorkflowType.Repair
                ? ComputerStatus.Active
                : ComputerStatus.Retired;

            // History бичлэг
            var history = new ComputerProcessHistory
            {
                Id = Guid.NewGuid(),
                ComputerId = req.Computer.Id,
                Type = req.Type,
                RequestId = req.Id,
                ActedByUserId = userId,
                CompletedAt = DateTime.UtcNow,
                Description = req.Description,
                Note = request.Note?.Trim()
            };
            await _context.ComputerProcessHistories.AddAsync(history);

            await _unitOfWork.SaveChangesAsync();

            await _notifications.CreateAsync(
                recipientId: req.RequestedByUserId,
                title: req.Type == WorkflowType.Repair
                    ? "Засвар дуусчээ"
                    : "Акт хасагдалт батлагдлаа",
                message: $"{req.Computer.AssetCode} компьютерийн '{LocalizedTypeName(req.Type)}' хүсэлт дууслаа.",
                type: $"ComputerProcess.{req.Type}.Completed");
        }
        else
        {
            req.CurrentStepIndex++;
            await _unitOfWork.SaveChangesAsync();
            await NotifyStepApproversAsync(steps[req.CurrentStepIndex], req, req.Computer);
        }

        return await GetByIdAsync(req.Id);
    }

    public async Task<ProcessRequestResponse> RejectCurrentStepAsync(Guid id, ProcessActionRequest request)
    {
        var userId = _currentUser.UserId
            ?? throw new ForbiddenException("Нэвтрэх шаардлагатай");

        var req = await LoadRequestAsync(id);
        if (req.Status != ProcessRequestStatus.PendingApproval)
            throw new BadRequestException("Энэ хүсэлт батлах төлөвт байхгүй байна");

        var steps = await _workflowService.LoadStepsForCompanyAsync(req.Computer.CompanyId, req.Type);
        if (req.CurrentStepIndex < 0 || req.CurrentStepIndex >= steps.Count)
            throw new BadRequestException("Workflow алхам алдаатай");

        var currentStep = steps[req.CurrentStepIndex];
        if (!currentStep.Approvers.Any(a => a.UserId == userId))
            throw new ForbiddenException("Та энэ алхмыг татгалзах эрхгүй байна");

        var approval = new ProcessStepApproval
        {
            Id = Guid.NewGuid(),
            ProcessRequestId = req.Id,
            StepOrder = currentStep.Order,
            ActedByUserId = userId,
            ActedAt = DateTime.UtcNow,
            IsApproval = false,
            Note = request.Note?.Trim()
        };
        await _context.ProcessStepApprovals.AddAsync(approval);

        req.Status = ProcessRequestStatus.Rejected;
        req.Computer.Status = ComputerStatus.Active;

        await _unitOfWork.SaveChangesAsync();

        await _notifications.CreateAsync(
            recipientId: req.RequestedByUserId,
            title: $"{LocalizedTypeName(req.Type)} татгалзагдлаа",
            message: $"{req.Computer.AssetCode} компьютерийн '{currentStep.Name}' алхамд татгалзлаа.",
            type: $"ComputerProcess.{req.Type}.Rejected");

        return await GetByIdAsync(req.Id);
    }

    public async Task<List<ProcessRequestListItem>> GetMyPendingApprovalsAsync(WorkflowType type)
    {
        var userId = _currentUser.UserId
            ?? throw new ForbiddenException("Нэвтрэх шаардлагатай");

        var stepOrdersByCompany = await _context.TransferWorkflowSteps
            .Where(s => s.WorkflowType == type
                && s.Approvers.Any(a => a.UserId == userId))
            .Select(s => new { s.CompanyId, StepOrder = s.Order })
            .ToListAsync();

        if (stepOrdersByCompany.Count == 0) return new List<ProcessRequestListItem>();

        var allCompanies = stepOrdersByCompany.Select(x => x.CompanyId).Distinct().ToList();

        var requests = await _context.ComputerProcessRequests
            .Include(r => r.Computer)
            .Include(r => r.RequestedByUser)
            .Where(r => r.Type == type)
            .Where(r => r.Status == ProcessRequestStatus.PendingApproval)
            .Where(r => allCompanies.Contains(r.Computer.CompanyId))
            .OrderBy(r => r.CreatedAt)
            .ToListAsync();

        var result = new List<ProcessRequestListItem>();
        foreach (var r in requests)
        {
            var hit = stepOrdersByCompany.Any(x =>
                x.CompanyId == r.Computer.CompanyId && x.StepOrder == r.CurrentStepIndex);
            if (!hit) continue;

            result.Add(new ProcessRequestListItem
            {
                Id = r.Id,
                Type = r.Type,
                ComputerId = r.ComputerId,
                AssetCode = r.Computer.AssetCode,
                ComputerLabel = r.Computer.Brand + " " + r.Computer.Model,
                RequestedByName = r.RequestedByUser.FullName,
                Status = r.Status.ToString(),
                Description = r.Description,
                CreatedAt = r.CreatedAt
            });
        }
        return result;
    }

    public async Task<List<ProcessRequestListItem>> GetByComputerAsync(Guid computerId, WorkflowType? type = null)
    {
        var query = _context.ComputerProcessRequests
            .Include(r => r.Computer)
            .Include(r => r.RequestedByUser)
            .Where(r => r.ComputerId == computerId);

        if (type.HasValue)
            query = query.Where(r => r.Type == type.Value);

        return await query
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new ProcessRequestListItem
            {
                Id = r.Id,
                Type = r.Type,
                ComputerId = r.ComputerId,
                AssetCode = r.Computer.AssetCode,
                ComputerLabel = r.Computer.Brand + " " + r.Computer.Model,
                RequestedByName = r.RequestedByUser.FullName,
                Status = r.Status.ToString(),
                Description = r.Description,
                CreatedAt = r.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<List<ProcessHistoryItem>> GetHistoryAsync(Guid computerId, WorkflowType? type = null)
    {
        var query = _context.ComputerProcessHistories
            .Include(h => h.ActedByUser)
            .Where(h => h.ComputerId == computerId);

        if (type.HasValue)
            query = query.Where(h => h.Type == type.Value);

        return await query
            .OrderByDescending(h => h.CompletedAt)
            .Select(h => new ProcessHistoryItem
            {
                Id = h.Id,
                Type = h.Type,
                RequestId = h.RequestId,
                ActedByName = h.ActedByUser.FullName,
                CompletedAt = h.CompletedAt,
                Description = h.Description,
                Note = h.Note
            })
            .ToListAsync();
    }

    // ─────────── helpers ───────────

    private async Task<ComputerProcessRequest> LoadRequestAsync(Guid id)
    {
        return await _context.ComputerProcessRequests
            .Include(r => r.Computer)
            .Include(r => r.RequestedByUser)
            .Include(r => r.StepApprovals)
                .ThenInclude(a => a.ActedByUser)
            .FirstOrDefaultAsync(r => r.Id == id)
            ?? throw new NotFoundException("Хүсэлт олдсонгүй");
    }

    private async Task<bool> IsAnyStepApproverAsync(Guid companyId, WorkflowType type, Guid userId)
    {
        return await _context.TransferWorkflowSteps
            .Where(s => s.CompanyId == companyId && s.WorkflowType == type)
            .AnyAsync(s => s.Approvers.Any(a => a.UserId == userId));
    }

    private async Task NotifyStepApproversAsync(
        TransferWorkflowStep step,
        ComputerProcessRequest req,
        Computer computer)
    {
        var approverIds = step.Approvers.Any()
            ? step.Approvers.Select(a => a.UserId).ToList()
            : await _context.TransferWorkflowStepApprovers
                .Where(a => a.StepId == step.Id)
                .Select(a => a.UserId)
                .ToListAsync();

        var typeName = LocalizedTypeName(req.Type);
        var msg = $"{computer.AssetCode} компьютер дээр '{step.Name}' алхмын зөвшөөрөл шаардлагатай ({typeName})";
        foreach (var uid in approverIds)
        {
            await _notifications.CreateAsync(
                recipientId: uid,
                title: $"Шинэ {typeName} хүсэлт",
                message: msg,
                type: $"ComputerProcess.{req.Type}.PendingApproval");
        }
    }

    private async Task<ProcessRequestResponse> BuildResponseAsync(ComputerProcessRequest req)
    {
        var steps = await _workflowService.LoadStepsForCompanyAsync(req.Computer.CompanyId, req.Type);

        var approvalsByOrder = req.StepApprovals
            .Where(a => a.IsApproval)
            .GroupBy(a => a.StepOrder)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(a => a.ActedAt).First());

        var approverIds = steps.SelectMany(s => s.Approvers.Select(a => a.UserId)).Distinct().ToList();
        var approverUsers = await _context.Users
            .Where(u => approverIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.FullName);

        var workflowSteps = steps.Select(s =>
        {
            var hasApproval = approvalsByOrder.TryGetValue(s.Order, out var approval);
            return new WorkflowStepProgress
            {
                Order = s.Order,
                Name = s.Name,
                ApproverUserIds = s.Approvers.Select(a => a.UserId).ToList(),
                ApproverNames = s.Approvers
                    .Select(a => approverUsers.GetValueOrDefault(a.UserId, "?"))
                    .ToList(),
                IsCompleted = hasApproval,
                IsCurrent = req.Status == ProcessRequestStatus.PendingApproval
                    && req.CurrentStepIndex == s.Order,
                ApprovedByUserId = hasApproval ? approval!.ActedByUserId : null,
                ApprovedByName = hasApproval
                    ? approverUsers.GetValueOrDefault(approval!.ActedByUserId, null)
                    : null,
                ApprovedAt = hasApproval ? approval!.ActedAt : null,
                Note = hasApproval ? approval!.Note : null
            };
        }).ToList();

        return new ProcessRequestResponse
        {
            Id = req.Id,
            Type = req.Type,
            ComputerId = req.ComputerId,
            AssetCode = req.Computer.AssetCode,
            ComputerLabel = req.Computer.Brand + " " + req.Computer.Model,
            RequestedByUserId = req.RequestedByUserId,
            RequestedByName = req.RequestedByUser.FullName,
            Status = req.Status.ToString(),
            Description = req.Description,
            CurrentStepIndex = req.CurrentStepIndex,
            WorkflowSteps = workflowSteps,
            CompletedAt = req.CompletedAt,
            CompletionNote = req.CompletionNote,
            CreatedAt = req.CreatedAt
        };
    }

    private static string LocalizedTypeName(WorkflowType type) => type switch
    {
        WorkflowType.Repair => "Засвар",
        WorkflowType.Retirement => "Акт хасагдалт",
        WorkflowType.Transfer => "Шилжүүлэг",
        _ => type.ToString()
    };
}
