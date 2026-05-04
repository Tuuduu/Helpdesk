namespace BishreltHelpdesk.Application.Interfaces;

public sealed record UploadFileInput(Stream Content, string FileName, string ContentType, long Length);

public interface IFileStorageService
{
    Task<string> SaveImageAsync(UploadFileInput file, string subFolder);
    Task DeleteAsync(string relativeUrl);
}
