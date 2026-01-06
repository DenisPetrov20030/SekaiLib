using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SekaiLib.Domain.Entities;

namespace SekaiLib.Infrastructure.Persistence.Configurations;

public class ChapterConfiguration : IEntityTypeConfiguration<Chapter>
{
    public void Configure(EntityTypeBuilder<Chapter> builder)
    {
        builder.HasKey(c => c.Id);
        
        builder.Property(c => c.Name)
            .IsRequired()
            .HasMaxLength(500);
        
        builder.Property(c => c.Content)
            .IsRequired();

        builder.HasIndex(c => new { c.TitleId, c.Number })
            .IsUnique();

        builder.HasOne(c => c.Title)
            .WithMany(t => t.Chapters)
            .HasForeignKey(c => c.TitleId);
    }
}
