using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BishreltHelpdesk.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddNotificationRelatedTransferId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "RelatedTransferId",
                table: "notifications",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_notifications_RelatedTransferId",
                table: "notifications",
                column: "RelatedTransferId");

            migrationBuilder.AddForeignKey(
                name: "FK_notifications_computer_transfer_requests_RelatedTransferId",
                table: "notifications",
                column: "RelatedTransferId",
                principalTable: "computer_transfer_requests",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_notifications_computer_transfer_requests_RelatedTransferId",
                table: "notifications");

            migrationBuilder.DropIndex(
                name: "IX_notifications_RelatedTransferId",
                table: "notifications");

            migrationBuilder.DropColumn(
                name: "RelatedTransferId",
                table: "notifications");
        }
    }
}
