using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SekaiLib.Migrations
{
    /// <inheritdoc />
    public partial class UpdateUserProfileFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Замінили AlterColumn на AddColumn
            migrationBuilder.AddColumn<int>(
                name: "ProfileVisibility",
                table: "Users",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Замінили AlterColumn на DropColumn (щоб можна було відкотити міграцію, якщо що)
            migrationBuilder.DropColumn(
                name: "ProfileVisibility",
                table: "Users");
        }
    }
}