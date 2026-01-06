using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SekaiLib.Domain.Entities;

namespace SekaiLib.Infrastructure.Persistence.Configurations;

public class TitleTranslatorConfiguration : IEntityTypeConfiguration<TitleTranslator>
{
    public void Configure(EntityTypeBuilder<TitleTranslator> builder)
    {
        builder.HasKey(tt => new { tt.TitleId, tt.TranslationTeamId });

        builder.HasOne(tt => tt.Title)
            .WithMany(t => t.TitleTranslators)
            .HasForeignKey(tt => tt.TitleId);

        builder.HasOne(tt => tt.TranslationTeam)
            .WithMany(t => t.TitleTranslators)
            .HasForeignKey(tt => tt.TranslationTeamId);
    }
}
