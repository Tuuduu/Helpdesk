using BishreltHelpdesk.Application.Interfaces;
using BishreltHelpdesk.Domain.Exceptions;
using Microsoft.AspNetCore.Hosting;

namespace BishreltHelpdesk.Infrastructure.Services;

public class LocalFileStorageService : IFileStorageService
{
    private const long MaxImageSizeBytes = 5 * 1024 * 1024;
    private static readonly string[] AllowedImageExtensions = { ".jpg", ".jpeg", ".png", ".webp" };
    private static readonly string[] AllowedImageContentTypes = { "image/jpeg", "image/png", "image/webp" };

    private readonly IWebHostEnvironment _env;

    public LocalFileStorageService(IWebHostEnvironment env)
    {
        _env = env;
    }

    public async Task<string> SaveImageAsync(UploadFileInput file, string subFolder)
    {
        if (file.Length <= 0)
            throw new BadRequestException("Файл хоосон байна");

        if (file.Length > MaxImageSizeBytes)
            throw new BadRequestException("Зургийн хэмжээ 5MB-аас хэтэрсэн байна");

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (string.IsNullOrEmpty(ext) || !AllowedImageExtensions.Contains(ext))
            throw new BadRequestException("Зөвхөн jpg, png, webp форматын зураг зөвшөөрөгдсөн");

        if (!AllowedImageContentTypes.Contains(file.ContentType.ToLowerInvariant()))
            throw new BadRequestException("Файлын төрөл зөвшөөрөгдөөгүй");

        var now = DateTime.UtcNow;
        var relativeFolder = Path.Combine("uploads", subFolder, now.Year.ToString(), now.Month.ToString("D2"))
            .Replace('\\', '/');

        var webRoot = _env.WebRootPath;
        if (string.IsNullOrEmpty(webRoot))
            webRoot = Path.Combine(_env.ContentRootPath, "wwwroot");

        var absoluteFolder = Path.Combine(webRoot, relativeFolder);
        Directory.CreateDirectory(absoluteFolder);

        var fileName = $"{Guid.NewGuid():N}{ext}";
        var absolutePath = Path.Combine(absoluteFolder, fileName);

        await using (var stream = File.Create(absolutePath))
        {
            await file.Content.CopyToAsync(stream);
        }

        return $"/{relativeFolder}/{fileName}";
    }

    public Task DeleteAsync(string relativeUrl)
    {
        if (string.IsNullOrWhiteSpace(relativeUrl))
            return Task.CompletedTask;

        var webRoot = _env.WebRootPath;
        if (string.IsNullOrEmpty(webRoot))
            webRoot = Path.Combine(_env.ContentRootPath, "wwwroot");

        var trimmed = relativeUrl.TrimStart('/');
        var absolutePath = Path.Combine(webRoot, trimmed.Replace('/', Path.DirectorySeparatorChar));

        if (File.Exists(absolutePath))
            File.Delete(absolutePath);

        return Task.CompletedTask;
    }
}
