using BishreltHelpdesk.Application.DTOs.About;
using BishreltHelpdesk.Application.Interfaces;
using BishreltHelpdesk.Domain.Exceptions;
using BishreltHelpdesk.Domain.Interfaces;
using BishreltHelpdesk.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BishreltHelpdesk.Infrastructure.Services;

public class AboutService : IAboutService
{
    private readonly AppDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;

    public AboutService(AppDbContext context, ICurrentUserService currentUser, IUnitOfWork unitOfWork)
    {
        _context = context;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
    }

    public async Task<AboutResponse> GetAsync()
    {
        var about = await _context.AboutContents
            .Include(a => a.UpdatedBy)
            .FirstOrDefaultAsync()
            ?? throw new NotFoundException("Тухай хуудас олдсонгүй");

        return new AboutResponse
        {
            Id = about.Id,
            Content = about.Content,
            Version = about.Version,
            UpdatedByName = about.UpdatedBy?.FullName,
            UpdatedAt = about.UpdatedAt
        };
    }

    public async Task<AboutResponse> UpdateAsync(UpdateAboutRequest request)
    {
        var about = await _context.AboutContents
            .Include(a => a.UpdatedBy)
            .FirstOrDefaultAsync()
            ?? throw new NotFoundException("Тухай хуудас олдсонгүй");

        about.Content = request.Content;
        about.Version = request.Version;
        about.UpdatedById = _currentUser.UserId;

        await _unitOfWork.SaveChangesAsync();

        // Reload to get updater name
        var updatedBy = _currentUser.UserId.HasValue
            ? await _context.Users.FindAsync(_currentUser.UserId.Value)
            : null;

        return new AboutResponse
        {
            Id = about.Id,
            Content = about.Content,
            Version = about.Version,
            UpdatedByName = updatedBy?.FullName,
            UpdatedAt = about.UpdatedAt
        };
    }
}
