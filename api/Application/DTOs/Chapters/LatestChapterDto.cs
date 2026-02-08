using SekaiLib.Application.DTOs.Titles;

namespace SekaiLib.Application.DTOs.Chapters;

public class LatestChapterDto
{
    public Guid Id { get; set; }
    public double Number { get; set; }
    public DateTime CreatedAt { get; set; }
    public TitleDto Title { get; set; }
}