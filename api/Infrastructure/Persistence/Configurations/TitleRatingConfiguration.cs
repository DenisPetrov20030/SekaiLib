using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SekaiLib.Domain.Entities;

namespace SekaiLib.Infrastructure.Persistence.Configurations;

public class TitleRatingConfiguration : IEntityTypeConfiguration<TitleRating>
{
    public void Configure(EntityTypeBuilder<TitleRating> builder)
    {
        builder.HasKey(r => r.Id);

        builder.HasOne(r => r.User)
            .WithMany(u => u.TitleRatings)
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.Title)
            .WithMany(t => t.Ratings)
            .HasForeignKey(r => r.TitleId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(r => new { r.UserId, r.TitleId }).IsUnique();
    }
}
