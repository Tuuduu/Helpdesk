using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BishreltHelpdesk.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProcessRequestsAndDepartmentSnapshots : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_transfer_workflow_steps_CompanyId_Order",
                table: "transfer_workflow_steps");

            migrationBuilder.AddColumn<string>(
                name: "WorkflowType",
                table: "transfer_workflow_steps",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Transfer");

            migrationBuilder.AddColumn<string>(
                name: "Department",
                table: "tickets",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Department",
                table: "computers",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "computer_process_requests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    Type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ComputerId = table.Column<Guid>(type: "uuid", nullable: false),
                    RequestedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false, defaultValue: "PendingApproval"),
                    CurrentStepIndex = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletionNote = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_computer_process_requests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_computer_process_requests_computers_ComputerId",
                        column: x => x.ComputerId,
                        principalTable: "computers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_computer_process_requests_users_RequestedByUserId",
                        column: x => x.RequestedByUserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "computer_process_histories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    ComputerId = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    RequestId = table.Column<Guid>(type: "uuid", nullable: false),
                    ActedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    Note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_computer_process_histories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_computer_process_histories_computer_process_requests_Reques~",
                        column: x => x.RequestId,
                        principalTable: "computer_process_requests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_computer_process_histories_computers_ComputerId",
                        column: x => x.ComputerId,
                        principalTable: "computers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_computer_process_histories_users_ActedByUserId",
                        column: x => x.ActedByUserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "process_step_approvals",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    ProcessRequestId = table.Column<Guid>(type: "uuid", nullable: false),
                    StepOrder = table.Column<int>(type: "integer", nullable: false),
                    ActedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ActedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsApproval = table.Column<bool>(type: "boolean", nullable: false),
                    Note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_process_step_approvals", x => x.Id);
                    table.ForeignKey(
                        name: "FK_process_step_approvals_computer_process_requests_ProcessReq~",
                        column: x => x.ProcessRequestId,
                        principalTable: "computer_process_requests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_process_step_approvals_users_ActedByUserId",
                        column: x => x.ActedByUserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_transfer_workflow_steps_CompanyId_WorkflowType_Order",
                table: "transfer_workflow_steps",
                columns: new[] { "CompanyId", "WorkflowType", "Order" });

            migrationBuilder.CreateIndex(
                name: "IX_computer_process_histories_ActedByUserId",
                table: "computer_process_histories",
                column: "ActedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_computer_process_histories_ComputerId_CompletedAt",
                table: "computer_process_histories",
                columns: new[] { "ComputerId", "CompletedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_computer_process_histories_RequestId",
                table: "computer_process_histories",
                column: "RequestId");

            migrationBuilder.CreateIndex(
                name: "IX_computer_process_requests_ComputerId_Type_Status",
                table: "computer_process_requests",
                columns: new[] { "ComputerId", "Type", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_computer_process_requests_RequestedByUserId",
                table: "computer_process_requests",
                column: "RequestedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_computer_process_requests_Status_CreatedAt",
                table: "computer_process_requests",
                columns: new[] { "Status", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_process_step_approvals_ActedByUserId",
                table: "process_step_approvals",
                column: "ActedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_process_step_approvals_ProcessRequestId_StepOrder",
                table: "process_step_approvals",
                columns: new[] { "ProcessRequestId", "StepOrder" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "computer_process_histories");

            migrationBuilder.DropTable(
                name: "process_step_approvals");

            migrationBuilder.DropTable(
                name: "computer_process_requests");

            migrationBuilder.DropIndex(
                name: "IX_transfer_workflow_steps_CompanyId_WorkflowType_Order",
                table: "transfer_workflow_steps");

            migrationBuilder.DropColumn(
                name: "WorkflowType",
                table: "transfer_workflow_steps");

            migrationBuilder.DropColumn(
                name: "Department",
                table: "tickets");

            migrationBuilder.DropColumn(
                name: "Department",
                table: "computers");

            migrationBuilder.CreateIndex(
                name: "IX_transfer_workflow_steps_CompanyId_Order",
                table: "transfer_workflow_steps",
                columns: new[] { "CompanyId", "Order" });
        }
    }
}
