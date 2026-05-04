using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BishreltHelpdesk.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTransferWorkflow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "computer_transfer_requests",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "PendingApproval",
                oldClrType: typeof(string),
                oldType: "character varying(30)",
                oldMaxLength: 30,
                oldDefaultValue: "PendingStorekeeper");

            migrationBuilder.AddColumn<int>(
                name: "CurrentStepIndex",
                table: "computer_transfer_requests",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "transfer_step_approvals",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    TransferId = table.Column<Guid>(type: "uuid", nullable: false),
                    StepOrder = table.Column<int>(type: "integer", nullable: false),
                    ApprovedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ApprovedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_transfer_step_approvals", x => x.Id);
                    table.ForeignKey(
                        name: "FK_transfer_step_approvals_computer_transfer_requests_Transfer~",
                        column: x => x.TransferId,
                        principalTable: "computer_transfer_requests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_transfer_step_approvals_users_ApprovedByUserId",
                        column: x => x.ApprovedByUserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "transfer_workflow_steps",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    CompanyId = table.Column<Guid>(type: "uuid", nullable: false),
                    Order = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_transfer_workflow_steps", x => x.Id);
                    table.ForeignKey(
                        name: "FK_transfer_workflow_steps_companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "transfer_workflow_step_approvers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    StepId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_transfer_workflow_step_approvers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_transfer_workflow_step_approvers_transfer_workflow_steps_St~",
                        column: x => x.StepId,
                        principalTable: "transfer_workflow_steps",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_transfer_workflow_step_approvers_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_transfer_step_approvals_ApprovedByUserId",
                table: "transfer_step_approvals",
                column: "ApprovedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_transfer_step_approvals_TransferId_StepOrder",
                table: "transfer_step_approvals",
                columns: new[] { "TransferId", "StepOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_transfer_workflow_step_approvers_StepId_UserId",
                table: "transfer_workflow_step_approvers",
                columns: new[] { "StepId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_transfer_workflow_step_approvers_UserId",
                table: "transfer_workflow_step_approvers",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_transfer_workflow_steps_CompanyId_Order",
                table: "transfer_workflow_steps",
                columns: new[] { "CompanyId", "Order" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "transfer_step_approvals");

            migrationBuilder.DropTable(
                name: "transfer_workflow_step_approvers");

            migrationBuilder.DropTable(
                name: "transfer_workflow_steps");

            migrationBuilder.DropColumn(
                name: "CurrentStepIndex",
                table: "computer_transfer_requests");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "computer_transfer_requests",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "PendingStorekeeper",
                oldClrType: typeof(string),
                oldType: "character varying(30)",
                oldMaxLength: 30,
                oldDefaultValue: "PendingApproval");
        }
    }
}
