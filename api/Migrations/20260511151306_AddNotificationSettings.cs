using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SekaiLib.Migrations
{
    /// <inheritdoc />
    public partial class AddNotificationSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "NotifyListStatuses",
                table: "Users",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: false,
                defaultValue: "0");

            migrationBuilder.AddColumn<string>(
                name: "NotifyUserListIds",
                table: "Users",
                type: "character varying(5000)",
                maxLength: 5000,
                nullable: false,
                defaultValue: "[]");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NotifyListStatuses",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "NotifyUserListIds",
                table: "Users");
        }
    }
}
