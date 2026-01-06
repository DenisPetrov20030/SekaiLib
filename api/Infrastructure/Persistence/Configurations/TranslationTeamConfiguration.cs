using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SekaiLib.Domain.Entities;

namespace SekaiLib.Infrastructure.Persistence.Configurations;

public class TranslationTeamConfiguration : IEntityTypeConfiguration<TranslationTeam>
{
    public void Configure(EntityTypeBuilder<TranslationTeam> builder)
    {
        builder.HasKey(tt => tt.Id);
        
        builder.Property(tt => tt.Name)
            .IsRequired()
            .HasMaxLength(200);
        
        builder.Property(tt => tt.Description)
            .HasMaxLength(1000);
    }
}
