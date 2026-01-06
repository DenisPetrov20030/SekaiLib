using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SekaiLib.Domain.Entities;

namespace SekaiLib.Infrastructure.Persistence.Configurations;

public class TitleGenreConfiguration : IEntityTypeConfiguration<TitleGenre>
{
    public void Configure(EntityTypeBuilder<TitleGenre> builder)
    {
        builder.HasKey(tg => new { tg.TitleId, tg.GenreId });

        builder.HasOne(tg => tg.Title)
            .WithMany(t => t.TitleGenres)
            .HasForeignKey(tg => tg.TitleId);

        builder.HasOne(tg => tg.Genre)
            .WithMany(g => g.TitleGenres)
            .HasForeignKey(tg => tg.GenreId);
    }
}
