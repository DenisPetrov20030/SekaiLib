using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SekaiLib.Migrations
{
    /// <inheritdoc />
    public partial class AddPublisherToTitle : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "PublisherId",
                table: "Titles",
                type: "uuid",
                nullable: true);

            migrationBuilder.Sql(@"
                UPDATE ""Titles"" 
                SET ""PublisherId"" = (SELECT ""Id"" FROM ""Users"" ORDER BY ""CreatedAt"" LIMIT 1)
                WHERE ""PublisherId"" IS NULL;
            ");

            migrationBuilder.AlterColumn<Guid>(
                name: "PublisherId",
                table: "Titles",
                type: "uuid",
                nullable: false);

            migrationBuilder.CreateIndex(
                name: "IX_Titles_PublisherId",
                table: "Titles",
                column: "PublisherId");

            migrationBuilder.AddForeignKey(
                name: "FK_Titles_Users_PublisherId",
                table: "Titles",
                column: "PublisherId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Titles_Users_PublisherId",
                table: "Titles");

            migrationBuilder.DropIndex(
                name: "IX_Titles_PublisherId",
                table: "Titles");

            migrationBuilder.DropColumn(
                name: "PublisherId",
                table: "Titles");
        }
    }
}
