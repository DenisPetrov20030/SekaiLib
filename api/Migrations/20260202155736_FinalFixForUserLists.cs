using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SekaiLib.Migrations
{
    /// <inheritdoc />
    public partial class FinalFixForUserLists : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserListTitles");

            migrationBuilder.AddColumn<Guid>(
                name: "TitleId1",
                table: "ReadingLists",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ReadingLists_TitleId1",
                table: "ReadingLists",
                column: "TitleId1");

            migrationBuilder.CreateIndex(
                name: "IX_ReadingLists_UserListId",
                table: "ReadingLists",
                column: "UserListId");

            migrationBuilder.AddForeignKey(
                name: "FK_ReadingLists_Titles_TitleId1",
                table: "ReadingLists",
                column: "TitleId1",
                principalTable: "Titles",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ReadingLists_UserLists_UserListId",
                table: "ReadingLists",
                column: "UserListId",
                principalTable: "UserLists",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ReadingLists_Titles_TitleId1",
                table: "ReadingLists");

            migrationBuilder.DropForeignKey(
                name: "FK_ReadingLists_UserLists_UserListId",
                table: "ReadingLists");

            migrationBuilder.DropIndex(
                name: "IX_ReadingLists_TitleId1",
                table: "ReadingLists");

            migrationBuilder.DropIndex(
                name: "IX_ReadingLists_UserListId",
                table: "ReadingLists");

            migrationBuilder.DropColumn(
                name: "TitleId1",
                table: "ReadingLists");

            migrationBuilder.CreateTable(
                name: "UserListTitles",
                columns: table => new
                {
                    TitlesId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserListsId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserListTitles", x => new { x.TitlesId, x.UserListsId });
                    table.ForeignKey(
                        name: "FK_UserListTitles_Titles_TitlesId",
                        column: x => x.TitlesId,
                        principalTable: "Titles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserListTitles_UserLists_UserListsId",
                        column: x => x.UserListsId,
                        principalTable: "UserLists",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserListTitles_UserListsId",
                table: "UserListTitles",
                column: "UserListsId");
        }
    }
}
