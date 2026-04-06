using BishreltHelpdesk.Application.Interfaces;

namespace BishreltHelpdesk.Infrastructure.Services;

public class PasswordHashService : IPasswordHashService
{
    public string Hash(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password, workFactor: 12);
    }

    public bool Verify(string password, string hash)
    {
        return BCrypt.Net.BCrypt.Verify(password, hash);
    }
}
