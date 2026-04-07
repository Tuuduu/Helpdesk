using BishreltHelpdesk.Application.DTOs.Common;
using BishreltHelpdesk.Application.DTOs.Tickets;
using BishreltHelpdesk.Application.Interfaces;
using BishreltHelpdesk.Domain.Entities;
using BishreltHelpdesk.Domain.Enums;
using BishreltHelpdesk.Domain.Exceptions;
using BishreltHelpdesk.Domain.Interfaces;
using BishreltHelpdesk.Domain.Interfaces.Repositories;
using BishreltHelpdesk.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BishreltHelpdesk.Infrastructure.Services;

public class TicketService : ITicketService
{
    private readonly ITicketRepository _ticketRepository;
    private readonly IUserRepository _userRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly AppDbContext _context;

    public TicketService(
        ITicketRepository ticketRepository,
        IUserRepository userRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUser,
        AppDbContext context)
    {
        _ticketRepository = ticketRepository;
        _userRepository = userRepository;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _context = context;
    }

    public async Task<TicketResponse> CreateAsync(CreateTicketRequest request)
    {
        var ticketNumber = await _ticketRepository.GenerateTicketNumberAsync();

        // Дуудлагын төрлөөс анхдагч зэрэглэл авах
        var callTypeConfig = await _context.CallTypeConfigs
            .FirstOrDefaultAsync(c => c.Code == request.CallType);
        var priority = callTypeConfig != null
            && Enum.TryParse<TicketPriority>(callTypeConfig.DefaultPriority, out var parsed)
            ? parsed
            : TicketPriority.Medium;

        var ticket = new Ticket
        {
            Id = Guid.NewGuid(),
            TicketNumber = ticketNumber,
            CallType = request.CallType,
            CompanyId = request.CompanyId,
            IsGuest = request.IsGuest,
            RequestedById = request.IsGuest ? null : _currentUser.UserId,
            FullName = request.FullName,
            Position = request.Position,
            ComputerNumber = request.ComputerNumber,
            PhoneNumber = request.PhoneNumber,
            Title = request.Title,
            Description = request.Description,
            Status = TicketStatus.New,
            Priority = priority
        };

        var history = new TicketHistory
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            PerformedById = _currentUser.UserId,
            Action = "Үүсгэсэн",
            ToValue = TicketStatus.New.ToString(),
            Note = "Тикет шинээр үүсгэгдлээ"
        };

        ticket.History.Add(history);

        await _ticketRepository.AddAsync(ticket);
        await _unitOfWork.SaveChangesAsync();

        return await GetByIdAsync(ticket.Id);
    }

    public async Task<PublicTicketResponse> CreatePublicAsync(PublicTicketRequest request)
    {
        var ticketNumber = await _ticketRepository.GenerateTicketNumberAsync();

        var callTypeConfig = await _context.CallTypeConfigs
            .FirstOrDefaultAsync(c => c.Code == request.CallType);
        var priority = callTypeConfig != null
            && Enum.TryParse<TicketPriority>(callTypeConfig.DefaultPriority, out var parsed)
            ? parsed
            : TicketPriority.Medium;

        var ticket = new Ticket
        {
            Id = Guid.NewGuid(),
            TicketNumber = ticketNumber,
            CallType = request.CallType,
            CompanyId = request.CompanyId,
            IsGuest = true,
            RequestedById = null,
            FullName = request.FullName,
            Position = request.Position,
            ComputerNumber = request.ComputerNumber,
            PhoneNumber = request.PhoneNumber,
            Title = request.Title,
            Description = request.Description,
            Status = TicketStatus.New,
            Priority = priority
        };

        var history = new TicketHistory
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            PerformedById = null,
            Action = "Үүсгэсэн",
            ToValue = TicketStatus.New.ToString(),
            Note = "Зочин хэрэглэгч тикет үүсгэсэн"
        };

        ticket.History.Add(history);
        await _ticketRepository.AddAsync(ticket);
        await _unitOfWork.SaveChangesAsync();

        var company = await _context.Companies.FindAsync(request.CompanyId);

        return new PublicTicketResponse
        {
            TicketNumber = ticket.TicketNumber,
            Title = ticket.Title,
            CompanyName = company?.Name ?? "",
            Status = ticket.Status.ToString(),
            CreatedAt = ticket.CreatedAt
        };
    }

    public async Task<TicketResponse> GetByIdAsync(Guid id)
    {
        var ticket = await _ticketRepository.GetWithDetailsAsync(id)
            ?? throw new NotFoundException("Тикет олдсонгүй");

        return MapToResponse(ticket);
    }

    public async Task<PagedResult<TicketListItem>> GetListAsync(TicketFilterRequest filter)
    {
        var query = _ticketRepository.QueryWithIncludes();

        // Search
        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var search = filter.Search.Trim().ToLower();
            query = query.Where(t =>
                t.TicketNumber.ToLower().Contains(search) ||
                t.Title.ToLower().Contains(search) ||
                t.FullName.ToLower().Contains(search) ||
                t.Company.Name.ToLower().Contains(search));
        }

        // Filters
        if (filter.Status.HasValue)
            query = query.Where(t => t.Status == filter.Status.Value);

        if (filter.CompanyId.HasValue)
            query = query.Where(t => t.CompanyId == filter.CompanyId.Value);

        if (filter.AssignedToId.HasValue)
            query = query.Where(t => t.AssignedToId == filter.AssignedToId.Value);

        if (filter.DateFrom.HasValue)
            query = query.Where(t => t.CreatedAt >= filter.DateFrom.Value);

        if (filter.DateTo.HasValue)
            query = query.Where(t => t.CreatedAt <= filter.DateTo.Value);

        // Sort
        query = filter.SortBy?.ToLower() switch
        {
            "ticketnumber" => filter.SortDescending
                ? query.OrderByDescending(t => t.TicketNumber)
                : query.OrderBy(t => t.TicketNumber),
            "title" => filter.SortDescending
                ? query.OrderByDescending(t => t.Title)
                : query.OrderBy(t => t.Title),
            "status" => filter.SortDescending
                ? query.OrderByDescending(t => t.Status)
                : query.OrderBy(t => t.Status),
            "priority" => filter.SortDescending
                ? query.OrderByDescending(t => t.Priority)
                : query.OrderBy(t => t.Priority),
            _ => filter.SortDescending
                ? query.OrderByDescending(t => t.CreatedAt)
                : query.OrderBy(t => t.CreatedAt)
        };

        var totalCount = await query.CountAsync();

        var items = await query
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(t => new TicketListItem
            {
                Id = t.Id,
                TicketNumber = t.TicketNumber,
                Title = t.Title,
                CompanyName = t.Company.Name,
                FullName = t.FullName,
                Status = t.Status.ToString(),
                Priority = t.Priority.ToString(),
                AssignedToName = t.AssignedTo != null ? t.AssignedTo.FullName : null,
                CreatedAt = t.CreatedAt
            })
            .ToListAsync();

        return new PagedResult<TicketListItem>
        {
            Items = items,
            TotalCount = totalCount,
            Page = filter.Page,
            PageSize = filter.PageSize
        };
    }

    public async Task<PagedResult<TicketListItem>> GetMyTicketsAsync(Guid userId, PagedRequest request)
    {
        var query = _ticketRepository.QueryWithIncludes()
            .Where(t => t.RequestedById == userId);

        query = request.SortDescending
            ? query.OrderByDescending(t => t.CreatedAt)
            : query.OrderBy(t => t.CreatedAt);

        var totalCount = await query.CountAsync();

        var items = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(t => new TicketListItem
            {
                Id = t.Id,
                TicketNumber = t.TicketNumber,
                Title = t.Title,
                CompanyName = t.Company.Name,
                FullName = t.FullName,
                Status = t.Status.ToString(),
                Priority = t.Priority.ToString(),
                AssignedToName = t.AssignedTo != null ? t.AssignedTo.FullName : null,
                CreatedAt = t.CreatedAt
            })
            .ToListAsync();

        return new PagedResult<TicketListItem>
        {
            Items = items,
            TotalCount = totalCount,
            Page = request.Page,
            PageSize = request.PageSize
        };
    }

    public async Task<TicketResponse> UpdateStatusAsync(Guid id, UpdateTicketStatusRequest request)
    {
        var ticket = await _ticketRepository.GetWithDetailsAsync(id)
            ?? throw new NotFoundException("Тикет олдсонгүй");

        var oldStatus = ticket.Status;
        ticket.Status = request.NewStatus;

        if (request.NewStatus == TicketStatus.Closed)
        {
            ticket.ClosedById = _currentUser.UserId;
            ticket.ClosedAt = DateTime.UtcNow;
        }

        var history = new TicketHistory
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            PerformedById = _currentUser.UserId,
            Action = "Төлөв өөрчилсөн",
            FromValue = oldStatus.ToString(),
            ToValue = request.NewStatus.ToString(),
            Note = request.Note
        };

        await _context.TicketHistories.AddAsync(history);
        await _unitOfWork.SaveChangesAsync();

        return MapToResponse(ticket);
    }

    public async Task<TicketResponse> AssignAsync(Guid id, AssignTicketRequest request)
    {
        var ticket = await _ticketRepository.GetWithDetailsAsync(id)
            ?? throw new NotFoundException("Тикет олдсонгүй");

        var engineer = await _userRepository.GetByIdAsync(request.AssignToId)
            ?? throw new NotFoundException("Инженер олдсонгүй");

        var oldAssignee = ticket.AssignedTo?.FullName;
        ticket.AssignedToId = request.AssignToId;
        ticket.AssignedTo = engineer;

        // Auto-accept if still New
        if (ticket.Status == TicketStatus.New)
            ticket.Status = TicketStatus.Accepted;

        var history = new TicketHistory
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            PerformedById = _currentUser.UserId,
            Action = "Хуваарилсан",
            FromValue = oldAssignee,
            ToValue = engineer.FullName,
            Note = null
        };

        await _context.TicketHistories.AddAsync(history);
        await _unitOfWork.SaveChangesAsync();

        return MapToResponse(ticket);
    }

    public async Task DeleteAsync(Guid id)
    {
        var ticket = await _ticketRepository.GetByIdAsync(id)
            ?? throw new NotFoundException("Тикет олдсонгүй");

        _ticketRepository.Delete(ticket);
        await _unitOfWork.SaveChangesAsync();
    }

    private static TicketResponse MapToResponse(Ticket t)
    {
        return new TicketResponse
        {
            Id = t.Id,
            TicketNumber = t.TicketNumber,
            Title = t.Title,
            Description = t.Description,
            CallType = t.CallType,
            CompanyName = t.Company?.Name ?? "",
            FullName = t.FullName,
            Position = t.Position,
            ComputerNumber = t.ComputerNumber,
            PhoneNumber = t.PhoneNumber,
            IsGuest = t.IsGuest,
            Status = t.Status.ToString(),
            Priority = t.Priority.ToString(),
            AssignedToName = t.AssignedTo?.FullName,
            ClosedByName = t.ClosedBy?.FullName,
            ClosedAt = t.ClosedAt,
            CreatedAt = t.CreatedAt,
            History = t.History
                .OrderBy(h => h.CreatedAt)
                .Select(h => new TicketHistoryItem
                {
                    Id = h.Id,
                    Action = h.Action,
                    FromValue = h.FromValue,
                    ToValue = h.ToValue,
                    PerformedByName = h.PerformedBy?.FullName ?? "",
                    Note = h.Note,
                    CreatedAt = h.CreatedAt
                })
                .ToList()
        };
    }
}
