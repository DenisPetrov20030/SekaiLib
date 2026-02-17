using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SekaiLib.Migrations
{
    /// <inheritdoc />
    public partial class FixReadingListTitleRelationship : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ReadingLists_Titles_TitleId1",
                table: "ReadingLists");

            migrationBuilder.DropIndex(
                name: "IX_ReadingLists_TitleId1",
                table: "ReadingLists");

            migrationBuilder.DropColumn(
                name: "TitleId1",
                table: "ReadingLists");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "TitleId1",
                table: "ReadingLists",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ReadingLists_TitleId1",
                table: "ReadingLists",
                column: "TitleId1");

            migrationBuilder.AddForeignKey(
                name: "FK_ReadingLists_Titles_TitleId1",
                table: "ReadingLists",
                column: "TitleId1",
                principalTable: "Titles",
                principalColumn: "Id");
        }
    }
}
