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

public class ComputerTransferService : IComputerTransferService
{
    private readonly IComputerRepository _computerRepository;
    private readonly IComputerTransferRequestRepository _transferRepository;
    private readonly IUserRepository _userRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly INotificationService _notifications;
    private readonly ITransferWorkflowService _workflowService;
    private readonly AppDbContext _context;

    public ComputerTransferService(
        IComputerRepository computerRepository,
        IComputerTransferRequestRepository transferRepository,
        IUserRepository userRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUser,
        INotificationService notifications,
        ITransferWorkflowService workflowService,
        AppDbContext context)
    {
        _computerRepository = computerRepository;
        _transferRepository = transferRepository;
        _userRepository = userRepository;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _notifications = notifications;
        _workflowService = workflowService;
        _context = context;
    }

    public async Task<TransferRequestResponse> GetByIdAsync(Guid id)
    {
        var transfer = await LoadTransferAsync(id);

        var userId = _currentUser.UserId;
        var isParticipant = userId == transfer.FromUserId
            || userId == transfer.ToUserId
            || userId == transfer.RequestedByUserId;
        var isAdminOfCompany = (_currentUser.Role == UserRole.Admin
                || _currentUser.Role == UserRole.SuperAdmin)
            && _currentUser.CompanyId == transfer.Computer.CompanyId;
        var isWorkflowApprover = userId.HasValue
            && await IsAnyStepApproverAsync(transfer.Computer.CompanyId, userId.Value);

        if (!isParticipant && !isAdminOfCompany && !isWorkflowApprover
            && _currentUser.Role != UserRole.SuperAdmin)
            throw new ForbiddenException("Энэ хүсэлт дээр хандах эрхгүй байна");

        return await BuildResponseAsync(transfer);
    }

    public async Task<TransferRequestResponse> CreateAsync(CreateTransferRequestRequest request)
    {
        var userId = _currentUser.UserId
            ?? throw new ForbiddenException("Нэвтрэх шаардлагатай");

        if (string.IsNullOrWhiteSpace(request.Reason))
            throw new BadRequestException("Шилжүүлгийн шалтгаан заавал бөглөнө");

        var computer = await _computerRepository.GetWithDetailsAsync(request.ComputerId)
            ?? throw new NotFoundException("Компьютер олдсонгүй");

        if (computer.OwnerUserId != userId)
            throw new ForbiddenException("Зөвхөн өөрийн эзэмшилд байгаа компьютер дээр шилжүүлэх хүсэлт үүсгэх боломжтой");

        if (computer.Status != ComputerStatus.Active)
            throw new BadRequestException("Зөвхөн идэвхтэй (Active) төлөвт байгаа компьютер шилжүүлэх боломжтой");

        if (request.ToUserId == userId)
            throw new BadRequestException("Өөрийн рүүгээ шилжүүлэх боломжгүй");

        var toUser = await _userRepository.GetByIdAsync(request.ToUserId)
            ?? throw new NotFoundException("Хүлээн авагч хэрэглэгч олдсонгүй");

        if (toUser.CompanyId != computer.CompanyId)
            throw new BadRequestException("Хүлээн авагч өөр компанид харьяалагдаж байна");

        if (!toUser.IsActive)
            throw new BadRequestException("Хүлээн авагч хэрэглэгч идэвхгүй байна");

        var steps = await _workflowService.LoadStepsForCompanyAsync(computer.CompanyId, WorkflowType.Transfer);

        var transfer = new ComputerTransferRequest
        {
            Id = Guid.NewGuid(),
            ComputerId = computer.Id,
            FromUserId = computer.OwnerUserId,
            ToUserId = request.ToUserId,
            RequestedByUserId = userId,
            Reason = request.Reason.Trim(),
            CurrentStepIndex = steps.Count == 0 ? -1 : 0,
            Status = steps.Count == 0
                ? TransferRequestStatus.PendingReceiver
                : TransferRequestStatus.PendingApproval
        };

        computer.Status = ComputerStatus.InTransfer;

        await _transferRepository.AddAsync(transfer);
        await _unitOfWork.SaveChangesAsync();

        if (steps.Count == 0)
        {
            await _notifications.CreateAsync(
                recipientId: transfer.ToUserId,
                title: "Компьютер хүлээн авах хүсэлт",
                message: $"{computer.AssetCode} компьютерийг танд шилжүүлж байна. Та хүлээн авах эсэхээ батална уу.",
                type: "ComputerTransfer.PendingReceiver",
                relatedTransferId: transfer.Id);
        }
        else
        {
            await NotifyStepApproversAsync(steps[0], transfer, computer);
        }

        return await GetByIdAsync(transfer.Id);
    }

    public async Task<TransferRequestResponse> ApproveCurrentStepAsync(Guid id, ApprovalActionRequest request)
    {
        var userId = _currentUser.UserId
            ?? throw new ForbiddenException("Нэвтрэх шаардлагатай");

        var transfer = await LoadTransferAsync(id);
        if (transfer.Status != TransferRequestStatus.PendingApproval)
            throw new BadRequestException("Энэ хүсэлт батлах төлөвт байхгүй байна");

        var steps = await _workflowService.LoadStepsForCompanyAsync(transfer.Computer.CompanyId, WorkflowType.Transfer);
        if (transfer.CurrentStepIndex < 0 || transfer.CurrentStepIndex >= steps.Count)
            throw new BadRequestException("Workflow алхам алдаатай");

        var currentStep = steps[transfer.CurrentStepIndex];
        if (!currentStep.Approvers.Any(a => a.UserId == userId))
            throw new ForbiddenException("Та энэ алхмыг батлах эрхгүй байна");

        var approval = new TransferStepApproval
        {
            Id = Guid.NewGuid(),
            TransferId = transfer.Id,
            StepOrder = currentStep.Order,
            ApprovedByUserId = userId,
            ApprovedAt = DateTime.UtcNow,
            Note = request.Note?.Trim()
        };
        await _context.TransferStepApprovals.AddAsync(approval);

        var isLastStep = transfer.CurrentStepIndex >= steps.Count - 1;
        if (isLastStep)
        {
            transfer.Status = TransferRequestStatus.PendingReceiver;
            await _unitOfWork.SaveChangesAsync();

            await _notifications.CreateAsync(
                recipientId: transfer.ToUserId,
                title: "Компьютер хүлээн авах хүсэлт",
                message: $"{transfer.Computer.AssetCode} компьютер бүх алхмыг батлуулсан. Та хүлээн авах эсэхээ батална уу.",
                type: "ComputerTransfer.PendingReceiver",
                relatedTransferId: transfer.Id);
        }
        else
        {
            transfer.CurrentStepIndex++;
            await _unitOfWork.SaveChangesAsync();
            await NotifyStepApproversAsync(steps[transfer.CurrentStepIndex], transfer, transfer.Computer);
        }

        return await GetByIdAsync(transfer.Id);
    }

    public async Task<TransferRequestResponse> RejectCurrentStepAsync(Guid id, ApprovalActionRequest request)
    {
        var userId = _currentUser.UserId
            ?? throw new ForbiddenException("Нэвтрэх шаардлагатай");

        var transfer = await LoadTransferAsync(id);
        if (transfer.Status != TransferRequestStatus.PendingApproval)
            throw new BadRequestException("Энэ хүсэлт батлах төлөвт байхгүй байна");

        var steps = await _workflowService.LoadStepsForCompanyAsync(transfer.Computer.CompanyId, WorkflowType.Transfer);
        if (transfer.CurrentStepIndex < 0 || transfer.CurrentStepIndex >= steps.Count)
            throw new BadRequestException("Workflow алхам алдаатай");

        var currentStep = steps[transfer.CurrentStepIndex];
        if (!currentStep.Approvers.Any(a => a.UserId == userId))
            throw new ForbiddenException("Та энэ алхмыг татгалзах эрхгүй байна");

        var approval = new TransferStepApproval
        {
            Id = Guid.NewGuid(),
            TransferId = transfer.Id,
            StepOrder = currentStep.Order,
            ApprovedByUserId = userId,
            ApprovedAt = DateTime.UtcNow,
            Note = "ТАТГАЛЗСАН: " + (request.Note?.Trim() ?? "")
        };
        await _context.TransferStepApprovals.AddAsync(approval);

        transfer.Status = TransferRequestStatus.Rejected;
        transfer.Computer.Status = ComputerStatus.Active;

        await _unitOfWork.SaveChangesAsync();

        await NotifyRejectionAsync(transfer, $"'{currentStep.Name}' алхамд татгалзсан");

        return await GetByIdAsync(transfer.Id);
    }

    public async Task<TransferRequestResponse> ApproveByReceiverAsync(Guid id, ReceiverActionRequest request)
    {
        var userId = _currentUser.UserId
            ?? throw new ForbiddenException("Нэвтрэх шаардлагатай");

        var transfer = await LoadTransferAsync(id);
        if (transfer.ToUserId != userId)
            throw new ForbiddenException("Зөвхөн хүлээн авагч өөрөө батлах боломжтой");
        if (transfer.Status != TransferRequestStatus.PendingReceiver)
            throw new BadRequestException("Энэ хүсэлт хүлээн авагчийн батлах төлөвт байхгүй байна");

        var receiver = await _userRepository.GetByIdAsync(transfer.ToUserId)
            ?? throw new NotFoundException("Хүлээн авагч олдсонгүй");

        var lastApproval = transfer.StepApprovals
            .OrderByDescending(a => a.StepOrder)
            .FirstOrDefault(a => !(a.Note ?? "").StartsWith("ТАТГАЛЗСАН"));
        var approverIdForHistory = lastApproval?.ApprovedByUserId ?? userId;

        await using var tx = await _context.Database.BeginTransactionAsync();
        try
        {
            transfer.Status = TransferRequestStatus.Approved;
            transfer.ReceiverActionAt = DateTime.UtcNow;
            transfer.ReceiverNote = request.Note?.Trim();

            var oldOwnerId = transfer.Computer.OwnerUserId;
            transfer.Computer.OwnerUserId = transfer.ToUserId;
            transfer.Computer.Position = string.IsNullOrWhiteSpace(receiver.Position)
                ? transfer.Computer.Position
                : receiver.Position;
            transfer.Computer.Status = ComputerStatus.Active;

            var history = new ComputerTransferHistory
            {
                Id = Guid.NewGuid(),
                ComputerId = transfer.Computer.Id,
                FromUserId = oldOwnerId,
                ToUserId = transfer.ToUserId,
                TransferredAt = DateTime.UtcNow,
                ApprovedByStorekeeperId = approverIdForHistory,
                RequestId = transfer.Id,
                Note = request.Note?.Trim()
            };
            await _context.ComputerTransferHistories.AddAsync(history);
            await _unitOfWork.SaveChangesAsync();
            await tx.CommitAsync();
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }

        await _notifications.CreateAsync(
            recipientId: transfer.FromUserId,
            title: "Шилжүүлэг батлагдлаа",
            message: $"{transfer.Computer.AssetCode} компьютерийн шилжүүлэг батлагдаж дууслаа.",
            type: "ComputerTransfer.Approved",
            relatedTransferId: transfer.Id);
        if (transfer.RequestedByUserId != transfer.FromUserId)
        {
            await _notifications.CreateAsync(
                recipientId: transfer.RequestedByUserId,
                title: "Шилжүүлэг батлагдлаа",
                message: $"{transfer.Computer.AssetCode} компьютерийн шилжүүлэг батлагдаж дууслаа.",
                type: "ComputerTransfer.Approved",
                relatedTransferId: transfer.Id);
        }

        return await GetByIdAsync(transfer.Id);
    }

    public async Task<TransferRequestResponse> RejectByReceiverAsync(Guid id, ReceiverActionRequest request)
    {
        var userId = _currentUser.UserId
            ?? throw new ForbiddenException("Нэвтрэх шаардлагатай");

        var transfer = await LoadTransferAsync(id);
        if (transfer.ToUserId != userId)
            throw new ForbiddenException("Зөвхөн хүлээн авагч өөрөө татгалзах боломжтой");
        if (transfer.Status != TransferRequestStatus.PendingReceiver)
            throw new BadRequestException("Энэ хүсэлт хүлээн авагчийн батлах төлөвт байхгүй байна");

        transfer.Status = TransferRequestStatus.Rejected;
        transfer.ReceiverActionAt = DateTime.UtcNow;
        transfer.ReceiverNote = request.Note?.Trim();
        transfer.Computer.Status = ComputerStatus.Active;

        await _unitOfWork.SaveChangesAsync();

        await NotifyRejectionAsync(transfer, "Хүлээн авагч татгалзсан");

        return await GetByIdAsync(transfer.Id);
    }

    public async Task<List<TransferRequestListItem>> GetMyPendingApprovalsAsync()
    {
        var userId = _currentUser.UserId
            ?? throw new ForbiddenException("Нэвтрэх шаардлагатай");

        var stepOrdersByCompany = await _context.TransferWorkflowSteps
            .Where(s => s.Approvers.Any(a => a.UserId == userId))
            .Select(s => new { s.CompanyId, s.Order })
            .ToListAsync();

        if (stepOrdersByCompany.Count == 0) return new List<TransferRequestListItem>();

        var allMatchingCompanies = stepOrdersByCompany.Select(x => x.CompanyId).Distinct().ToList();

        var transfers = await _transferRepository.QueryWithIncludes()
            .Where(r => r.Status == TransferRequestStatus.PendingApproval)
            .Where(r => allMatchingCompanies.Contains(r.Computer.CompanyId))
            .OrderBy(r => r.CreatedAt)
            .ToListAsync();

        var result = new List<TransferRequestListItem>();
        foreach (var t in transfers)
        {
            var hit = stepOrdersByCompany.Any(x =>
                x.CompanyId == t.Computer.CompanyId && x.Order == t.CurrentStepIndex);
            if (!hit) continue;

            result.Add(new TransferRequestListItem
            {
                Id = t.Id,
                ComputerId = t.ComputerId,
                AssetCode = t.Computer.AssetCode,
                ComputerLabel = t.Computer.Brand + " " + t.Computer.Model,
                FromUserName = t.FromUser.FullName,
                ToUserName = t.ToUser.FullName,
                Status = t.Status.ToString(),
                Reason = t.Reason,
                CreatedAt = t.CreatedAt
            });
        }
        return result;
    }

    public async Task<List<TransferRequestListItem>> GetPendingForReceiverAsync()
    {
        var userId = _currentUser.UserId
            ?? throw new ForbiddenException("Нэвтрэх шаардлагатай");

        return await _transferRepository.QueryWithIncludes()
            .Where(r => r.ToUserId == userId && r.Status == TransferRequestStatus.PendingReceiver)
            .OrderBy(r => r.CreatedAt)
            .Select(r => new TransferRequestListItem
            {
                Id = r.Id,
                ComputerId = r.ComputerId,
                AssetCode = r.Computer.AssetCode,
                ComputerLabel = r.Computer.Brand + " " + r.Computer.Model,
                FromUserName = r.FromUser.FullName,
                ToUserName = r.ToUser.FullName,
                Status = r.Status.ToString(),
                Reason = r.Reason,
                CreatedAt = r.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<List<TransferHistoryItem>> GetHistoryAsync(Guid computerId)
    {
        var computer = await _computerRepository.GetByIdAsync(computerId)
            ?? throw new NotFoundException("Компьютер олдсонгүй");

        if (_currentUser.Role != UserRole.SuperAdmin
            && _currentUser.CompanyId.HasValue
            && _currentUser.CompanyId != computer.CompanyId)
        {
            throw new ForbiddenException("Энэ компьютерт хандах эрхгүй байна");
        }

        return await _context.ComputerTransferHistories
            .Where(h => h.ComputerId == computerId)
            .Include(h => h.FromUser)
            .Include(h => h.ToUser)
            .Include(h => h.ApprovedByStorekeeper)
            .OrderByDescending(h => h.TransferredAt)
            .Select(h => new TransferHistoryItem
            {
                Id = h.Id,
                RequestId = h.RequestId,
                FromUserName = h.FromUser != null ? h.FromUser.FullName : null,
                ToUserName = h.ToUser.FullName,
                ApprovedByStorekeeperName = h.ApprovedByStorekeeper.FullName,
                TransferredAt = h.TransferredAt,
                Note = h.Note
            })
            .ToListAsync();
    }

    // ─────────── helpers ───────────

    private async Task<ComputerTransferRequest> LoadTransferAsync(Guid id)
    {
        return await _context.ComputerTransferRequests
            .Include(r => r.Computer)
            .Include(r => r.FromUser)
            .Include(r => r.ToUser)
            .Include(r => r.RequestedByUser)
            .Include(r => r.StepApprovals)
                .ThenInclude(a => a.ApprovedByUser)
            .FirstOrDefaultAsync(r => r.Id == id)
            ?? throw new NotFoundException("Шилжүүлгийн хүсэлт олдсонгүй");
    }

    private async Task<bool> IsAnyStepApproverAsync(Guid companyId, Guid userId)
    {
        return await _context.TransferWorkflowSteps
            .Where(s => s.CompanyId == companyId)
            .AnyAsync(s => s.Approvers.Any(a => a.UserId == userId));
    }

    private async Task NotifyStepApproversAsync(
        TransferWorkflowStep step,
        ComputerTransferRequest transfer,
        Computer computer)
    {
        var approverIds = step.Approvers.Any()
            ? step.Approvers.Select(a => a.UserId).ToList()
            : await _context.TransferWorkflowStepApprovers
                .Where(a => a.StepId == step.Id)
                .Select(a => a.UserId)
                .ToListAsync();

        var message = $"{computer.AssetCode} компьютер дээр '{step.Name}' алхмын зөвшөөрөл шаардлагатай";
        foreach (var uid in approverIds)
        {
            await _notifications.CreateAsync(
                recipientId: uid,
                title: "Шинэ батлах хүсэлт",
                message: message,
                type: "ComputerTransfer.PendingApproval",
                relatedTransferId: transfer.Id);
        }
    }

    private async Task NotifyRejectionAsync(ComputerTransferRequest transfer, string reason)
    {
        var msg = $"{transfer.Computer.AssetCode} компьютерийн шилжүүлэг татгалзагдлаа: {reason}";
        await _notifications.CreateAsync(
            recipientId: transfer.RequestedByUserId,
            title: "Шилжүүлэг татгалзагдлаа",
            message: msg,
            type: "ComputerTransfer.Rejected",
            relatedTransferId: transfer.Id);
        if (transfer.RequestedByUserId != transfer.FromUserId)
        {
            await _notifications.CreateAsync(
                recipientId: transfer.FromUserId,
                title: "Шилжүүлэг татгалзагдлаа",
                message: msg,
                type: "ComputerTransfer.Rejected",
                relatedTransferId: transfer.Id);
        }
    }

    private async Task<TransferRequestResponse> BuildResponseAsync(ComputerTransferRequest transfer)
    {
        var steps = await _workflowService.LoadStepsForCompanyAsync(transfer.Computer.CompanyId, WorkflowType.Transfer);

        var approvalsByOrder = transfer.StepApprovals
            .Where(a => !(a.Note ?? "").StartsWith("ТАТГАЛЗСАН"))
            .GroupBy(a => a.StepOrder)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(a => a.ApprovedAt).First());

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
                IsCurrent = transfer.Status == TransferRequestStatus.PendingApproval
                    && transfer.CurrentStepIndex == s.Order,
                ApprovedByUserId = hasApproval ? approval!.ApprovedByUserId : null,
                ApprovedByName = hasApproval
                    ? approverUsers.GetValueOrDefault(approval!.ApprovedByUserId, null)
                    : null,
                ApprovedAt = hasApproval ? approval!.ApprovedAt : null,
                Note = hasApproval ? approval!.Note : null
            };
        }).ToList();

        return new TransferRequestResponse
        {
            Id = transfer.Id,
            ComputerId = transfer.ComputerId,
            AssetCode = transfer.Computer.AssetCode,
            ComputerLabel = transfer.Computer.Brand + " " + transfer.Computer.Model,
            FromUserId = transfer.FromUserId,
            FromUserName = transfer.FromUser.FullName,
            ToUserId = transfer.ToUserId,
            ToUserName = transfer.ToUser.FullName,
            RequestedByUserId = transfer.RequestedByUserId,
            RequestedByName = transfer.RequestedByUser.FullName,
            CurrentStepIndex = transfer.CurrentStepIndex,
            WorkflowSteps = workflowSteps,
            ReceiverActionAt = transfer.ReceiverActionAt,
            ReceiverNote = transfer.ReceiverNote,
            Status = transfer.Status.ToString(),
            Reason = transfer.Reason,
            CreatedAt = transfer.CreatedAt
        };
    }
}
