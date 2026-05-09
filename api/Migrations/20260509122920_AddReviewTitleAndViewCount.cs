using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SekaiLib.Migrations
{
    /// <inheritdoc />
    public partial class AddReviewTitleAndViewCount : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ReviewTitle",
                table: "Reviews",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.Sql("UPDATE \"Reviews\" SET \"ReviewTitle\" = LEFT(\"Content\", 200) WHERE COALESCE(\"ReviewTitle\", '') = '';");

            migrationBuilder.AddColumn<int>(
                name: "ViewCount",
                table: "Reviews",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ReviewTitle",
                table: "Reviews");

            migrationBuilder.DropColumn(
                name: "ViewCount",
                table: "Reviews");
        }
    }
}
