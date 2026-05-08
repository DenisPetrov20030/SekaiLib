using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SekaiLib.Migrations
{
    /// <inheritdoc />
    public partial class AddTitleComments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TitleComments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TitleId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ParentCommentId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TitleComments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TitleComments_TitleComments_ParentCommentId",
                        column: x => x.ParentCommentId,
                        principalTable: "TitleComments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TitleComments_Titles_TitleId",
                        column: x => x.TitleId,
                        principalTable: "Titles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TitleComments_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TitleCommentReactions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CommentId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TitleCommentReactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TitleCommentReactions_TitleComments_CommentId",
                        column: x => x.CommentId,
                        principalTable: "TitleComments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TitleCommentReactions_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TitleCommentReactions_CommentId",
                table: "TitleCommentReactions",
                column: "CommentId");

            migrationBuilder.CreateIndex(
                name: "IX_TitleCommentReactions_UserId",
                table: "TitleCommentReactions",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_TitleComments_ParentCommentId",
                table: "TitleComments",
                column: "ParentCommentId");

            migrationBuilder.CreateIndex(
                name: "IX_TitleComments_TitleId",
                table: "TitleComments",
                column: "TitleId");

            migrationBuilder.CreateIndex(
                name: "IX_TitleComments_UserId",
                table: "TitleComments",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TitleCommentReactions");

            migrationBuilder.DropTable(
                name: "TitleComments");
        }
    }
}
