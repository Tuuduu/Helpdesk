namespace BishreltHelpdesk.API.Authorization;

public static class Policies
{
    public const string SuperAdminOnly = "SuperAdminOnly";
    public const string AdminOrAbove = "AdminOrAbove";
    public const string Authenticated = "Authenticated";
}
