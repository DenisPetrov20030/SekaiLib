using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SekaiLib.Domain.Entities;

namespace SekaiLib.Infrastructure.Persistence.Configurations;

public class TitleConfiguration : IEntityTypeConfiguration<Title>
{
    public void Configure(EntityTypeBuilder<Title> builder)
    {
        builder.HasKey(t => t.Id);
        
        builder.Property(t => t.Name)
            .IsRequired()
            .HasMaxLength(500);
        
        builder.Property(t => t.Author)
            .IsRequired()
            .HasMaxLength(255);
        
        builder.Property(t => t.Description)
            .HasMaxLength(5000);

        builder.Property(t => t.CoverImageUrl)
            .HasMaxLength(1000);

        builder.Property(t => t.CountryOfOrigin)
            .HasMaxLength(100);

        builder.HasMany(t => t.Chapters)
            .WithOne(c => c.Title)
            .HasForeignKey(c => c.TitleId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
