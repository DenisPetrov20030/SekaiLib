using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SekaiLib.Domain.Entities;

namespace SekaiLib.Infrastructure.Persistence.Configurations;

public class ReviewViewConfiguration : IEntityTypeConfiguration<ReviewView>
{
    public void Configure(EntityTypeBuilder<ReviewView> builder)
    {
        builder.HasKey(v => v.Id);

        builder.Property(v => v.IpHash)
            .HasMaxLength(64)
            .IsRequired();

        builder.Property(v => v.ViewedAt)
            .IsRequired();

        builder.HasOne(v => v.Review)
            .WithMany()
            .HasForeignKey(v => v.ReviewId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(v => new { v.ReviewId, v.UserId });
        builder.HasIndex(v => new { v.ReviewId, v.IpHash });
    }
}
