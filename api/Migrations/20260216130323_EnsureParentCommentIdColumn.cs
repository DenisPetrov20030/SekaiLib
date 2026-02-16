using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SekaiLib.Migrations
{
    /// <inheritdoc />
    public partial class EnsureParentCommentIdColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER TABLE ""ReviewComments""
                ADD COLUMN IF NOT EXISTS ""ParentCommentId"" uuid NULL;
            ");

            migrationBuilder.Sql(@"
                CREATE INDEX IF NOT EXISTS ""IX_ReviewComments_ParentCommentId""
                ON ""ReviewComments"" (""ParentCommentId"");
            ");

            migrationBuilder.Sql(@"
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint
                        WHERE conname = 'FK_ReviewComments_ReviewComments_ParentCommentId'
                    ) THEN
                        ALTER TABLE ""ReviewComments""
                        ADD CONSTRAINT ""FK_ReviewComments_ReviewComments_ParentCommentId""
                        FOREIGN KEY (""ParentCommentId"")
                        REFERENCES ""ReviewComments""(""Id"")
                        ON DELETE CASCADE;
                    END IF;
                END $$;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM pg_constraint
                        WHERE conname = 'FK_ReviewComments_ReviewComments_ParentCommentId'
                    ) THEN
                        ALTER TABLE ""ReviewComments""
                        DROP CONSTRAINT ""FK_ReviewComments_ReviewComments_ParentCommentId"";
                    END IF;
                END $$;
            ");

            migrationBuilder.Sql(@"
                DROP INDEX IF EXISTS ""IX_ReviewComments_ParentCommentId"";
            ");

            migrationBuilder.Sql(@"
                ALTER TABLE ""ReviewComments""
                DROP COLUMN IF EXISTS ""ParentCommentId"";
            ");
        }
    }
}
