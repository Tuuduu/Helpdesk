using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BishreltHelpdesk.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddIsGlobalApproverToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsGlobalApprover",
                table: "users",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsGlobalApprover",
                table: "users");
        }
    }
}
