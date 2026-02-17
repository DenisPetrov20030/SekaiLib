using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SekaiLib.Migrations
{
    /// <inheritdoc />
    public partial class EnsureReviewCommentReactions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Ensure parent table exists before creating FK from ReviewCommentReactions.
            migrationBuilder.Sql(@"
                CREATE TABLE IF NOT EXISTS ""ReviewComments"" (
                    ""Id"" uuid NOT NULL,
                    ""ReviewId"" uuid NOT NULL,
                    ""UserId"" uuid NOT NULL,
                    ""Content"" text NOT NULL,
                    ""CreatedAt"" timestamp with time zone NOT NULL,
                    CONSTRAINT ""PK_ReviewComments"" PRIMARY KEY (""Id""),
                    CONSTRAINT ""FK_ReviewComments_Reviews_ReviewId"" FOREIGN KEY (""ReviewId"") REFERENCES ""Reviews"" (""Id"") ON DELETE CASCADE,
                    CONSTRAINT ""FK_ReviewComments_Users_UserId"" FOREIGN KEY (""UserId"") REFERENCES ""Users"" (""Id"") ON DELETE CASCADE
                );
            ");

            migrationBuilder.Sql(@"
                CREATE INDEX IF NOT EXISTS ""IX_ReviewComments_ReviewId""
                ON ""ReviewComments"" (""ReviewId"");
            ");

            migrationBuilder.Sql(@"
                CREATE INDEX IF NOT EXISTS ""IX_ReviewComments_UserId""
                ON ""ReviewComments"" (""UserId"");
            ");

            migrationBuilder.CreateTable(
                name: "ReviewCommentReactions",
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
                    table.PrimaryKey("PK_ReviewCommentReactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReviewCommentReactions_ReviewComments_CommentId",
                        column: x => x.CommentId,
                        principalTable: "ReviewComments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ReviewCommentReactions_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ReviewCommentReactions_CommentId",
                table: "ReviewCommentReactions",
                column: "CommentId");

            migrationBuilder.CreateIndex(
                name: "IX_ReviewCommentReactions_UserId",
                table: "ReviewCommentReactions",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ReviewCommentReactions");
        }
    }
}
