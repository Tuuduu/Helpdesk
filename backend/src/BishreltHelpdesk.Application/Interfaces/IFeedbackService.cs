using BishreltHelpdesk.Application.DTOs.Common;
using BishreltHelpdesk.Application.DTOs.Feedback;

namespace BishreltHelpdesk.Application.Interfaces;

public interface IFeedbackService
{
    Task<FeedbackResponse> CreateAsync(CreateFeedbackRequest request);
    Task<PagedResult<FeedbackResponse>> GetListAsync(FeedbackFilterRequest filter);
    Task<List<FeedbackResponse>> GetMyFeedbacksAsync(Guid userId);
}
