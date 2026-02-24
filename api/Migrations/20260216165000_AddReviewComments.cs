using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SekaiLib.Migrations
{
    public partial class AddReviewComments : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                CREATE INDEX IF NOT EXISTS ""IX_ReviewComments_ReviewId""
                ON ""ReviewComments"" (""ReviewId"");
            ");

            migrationBuilder.Sql(@"
                CREATE INDEX IF NOT EXISTS ""IX_ReviewComments_UserId""
                ON ""ReviewComments"" (""UserId"");
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                DROP INDEX IF EXISTS ""IX_ReviewComments_ReviewId"";
            ");

            migrationBuilder.Sql(@"
                DROP INDEX IF EXISTS ""IX_ReviewComments_UserId"";
            ");
        }
    }
}
