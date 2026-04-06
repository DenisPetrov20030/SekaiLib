using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SekaiLib.Migrations
{
    /// <inheritdoc />
    public partial class AddTranslationTeamFeatures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AvatarUrl",
                table: "TranslationTeams",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "OwnerId",
                table: "TranslationTeams",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "TranslationTeamId",
                table: "Chapters",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "TranslationTeamMembers",
                columns: table => new
                {
                    TeamId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Role = table.Column<int>(type: "integer", nullable: false),
                    JoinedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TranslationTeamMembers", x => new { x.TeamId, x.UserId });
                    table.ForeignKey(
                        name: "FK_TranslationTeamMembers_TranslationTeams_TeamId",
                        column: x => x.TeamId,
                        principalTable: "TranslationTeams",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TranslationTeamMembers_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TranslationTeamSubscriptions",
                columns: table => new
                {
                    TeamId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    SubscribedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TranslationTeamSubscriptions", x => new { x.TeamId, x.UserId });
                    table.ForeignKey(
                        name: "FK_TranslationTeamSubscriptions_TranslationTeams_TeamId",
                        column: x => x.TeamId,
                        principalTable: "TranslationTeams",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TranslationTeamSubscriptions_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TranslationTeams_OwnerId",
                table: "TranslationTeams",
                column: "OwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_Chapters_TranslationTeamId",
                table: "Chapters",
                column: "TranslationTeamId");

            migrationBuilder.CreateIndex(
                name: "IX_TranslationTeamMembers_UserId",
                table: "TranslationTeamMembers",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_TranslationTeamSubscriptions_UserId",
                table: "TranslationTeamSubscriptions",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Chapters_TranslationTeams_TranslationTeamId",
                table: "Chapters",
                column: "TranslationTeamId",
                principalTable: "TranslationTeams",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_TranslationTeams_Users_OwnerId",
                table: "TranslationTeams",
                column: "OwnerId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Chapters_TranslationTeams_TranslationTeamId",
                table: "Chapters");

            migrationBuilder.DropForeignKey(
                name: "FK_TranslationTeams_Users_OwnerId",
                table: "TranslationTeams");

            migrationBuilder.DropTable(
                name: "TranslationTeamMembers");

            migrationBuilder.DropTable(
                name: "TranslationTeamSubscriptions");

            migrationBuilder.DropIndex(
                name: "IX_TranslationTeams_OwnerId",
                table: "TranslationTeams");

            migrationBuilder.DropIndex(
                name: "IX_Chapters_TranslationTeamId",
                table: "Chapters");

            migrationBuilder.DropColumn(
                name: "AvatarUrl",
                table: "TranslationTeams");

            migrationBuilder.DropColumn(
                name: "OwnerId",
                table: "TranslationTeams");

            migrationBuilder.DropColumn(
                name: "TranslationTeamId",
                table: "Chapters");
        }
    }
}
