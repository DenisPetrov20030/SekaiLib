public class CreateReadingListDto
{
    public Guid TitleId { get; set; }
    public int? Status { get; set; } 
    public Guid? UserListId { get; set; } 
}