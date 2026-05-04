using BishreltHelpdesk.Application.DTOs.TransferWorkflows;
using BishreltHelpdesk.Application.Interfaces;
using BishreltHelpdesk.Domain.Entities;
using BishreltHelpdesk.Domain.Enums;
using BishreltHelpdesk.Domain.Exceptions;
using BishreltHelpdesk.Domain.Interfaces;
using BishreltHelpdesk.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BishreltHelpdesk.Infrastructure.Services;

public class TransferWorkflowService : ITransferWorkflowService
{
    private readonly AppDbContext _context;
    private readonly IUnitOfWork _unitOfWork;

    public TransferWorkflowService(AppDbContext context, IUnitOfWork unitOfWork)
    {
        _context = context;
        _unitOfWork = unitOfWork;
    }

    public async Task<List<TransferWorkflowStepDto>> GetByCompanyAsync(Guid companyId, WorkflowType type)
    {
        var steps = await _context.TransferWorkflowSteps
            .Where(s => s.CompanyId == companyId && s.WorkflowType == type)
            .Include(s => s.Approvers)
                .ThenInclude(a => a.User)
            .OrderBy(s => s.Order)
            .ToListAsync();

        return steps.Select(s => new TransferWorkflowStepDto
        {
            Id = s.Id,
            Order = s.Order,
            Name = s.Name,
            Approvers = s.Approvers.Select(a => new WorkflowApproverDto
            {
                UserId = a.UserId,
                FullName = a.User.FullName,
                Position = a.User.Position
            }).ToList()
        }).ToList();
    }

    public async Task<List<TransferWorkflowStepDto>> SaveAsync(SaveWorkflowRequest request)
    {
        var company = await _context.Companies.FindAsync(request.CompanyId)
            ?? throw new NotFoundException("Компани олдсонгүй");

        foreach (var s in request.Steps)
        {
            if (string.IsNullOrWhiteSpace(s.Name))
                throw new BadRequestException("Алхам тус бүрд нэр өгнө үү");
            if (s.ApproverUserIds.Count == 0)
                throw new BadRequestException($"'{s.Name}' алхамд дор хаяж нэг батлагч сонгоно уу");
        }

        var allUserIds = request.Steps.SelectMany(s => s.ApproverUserIds).Distinct().ToList();
        var users = await _context.Users
            .Where(u => allUserIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id);
        foreach (var uid in allUserIds)
            if (!users.ContainsKey(uid))
                throw new BadRequestException($"Хэрэглэгч олдсонгүй: {uid}");

        var existing = await _context.TransferWorkflowSteps
            .Where(s => s.CompanyId == request.CompanyId && s.WorkflowType == request.WorkflowType)
            .Include(s => s.Approvers)
            .ToListAsync();
        _context.TransferWorkflowSteps.RemoveRange(existing);

        for (int i = 0; i < request.Steps.Count; i++)
        {
            var input = request.Steps[i];
            var step = new TransferWorkflowStep
            {
                Id = Guid.NewGuid(),
                CompanyId = request.CompanyId,
                WorkflowType = request.WorkflowType,
                Order = i,
                Name = input.Name.Trim()
            };
            foreach (var uid in input.ApproverUserIds.Distinct())
            {
                step.Approvers.Add(new TransferWorkflowStepApprover
                {
                    Id = Guid.NewGuid(),
                    UserId = uid
                });
            }
            await _context.TransferWorkflowSteps.AddAsync(step);
        }

        await _unitOfWork.SaveChangesAsync();
        return await GetByCompanyAsync(request.CompanyId, request.WorkflowType);
    }

    public async Task<List<TransferWorkflowStep>> LoadStepsForCompanyAsync(Guid companyId, WorkflowType type)
    {
        return await _context.TransferWorkflowSteps
            .Where(s => s.CompanyId == companyId && s.WorkflowType == type)
            .Include(s => s.Approvers)
            .OrderBy(s => s.Order)
            .ToListAsync();
    }
}
