using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BishreltHelpdesk.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCallTypeDefaultPriority : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DefaultPriority",
                table: "call_type_configs",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Medium");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DefaultPriority",
                table: "call_type_configs");
        }
    }
}
