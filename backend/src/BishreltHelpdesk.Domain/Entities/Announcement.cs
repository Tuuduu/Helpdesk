namespace BishreltHelpdesk.Domain.Entities;

/// <summary>
/// Нэвтрэх хуудсанд гадны хэрэглэгчдэд харагдах мэдэгдэл.
/// Жишээ нь: "Энэ системийг манай инженер засахгүй, нийлүүлэгч компанийн
/// инженер рүү залгана уу" гэх мэт чиглүүлэг.
/// </summary>
public class Announcement : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;

    /// <summary>"info", "warning", "success", "danger" — UI бадгын өнгө сонгоно.</summary>
    public string Level { get; set; } = "info";

    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}
