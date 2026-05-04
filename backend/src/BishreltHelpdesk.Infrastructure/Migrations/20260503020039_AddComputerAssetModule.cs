using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BishreltHelpdesk.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddComputerAssetModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "computers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    AssetCode = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Brand = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Model = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Monitor = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Cpu = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    RamGb = table.Column<int>(type: "integer", nullable: false),
                    Gpu = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    MacAddress = table.Column<string>(type: "character varying(17)", maxLength: 17, nullable: false),
                    DomainName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    OwnerUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Position = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    CompanyId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Active"),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_computers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_computers_companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_computers_users_OwnerUserId",
                        column: x => x.OwnerUserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "computer_images",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    ComputerId = table.Column<Guid>(type: "uuid", nullable: false),
                    ImageUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    IsPrimary = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    UploadedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_computer_images", x => x.Id);
                    table.ForeignKey(
                        name: "FK_computer_images_computers_ComputerId",
                        column: x => x.ComputerId,
                        principalTable: "computers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "computer_storages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    ComputerId = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    CapacityGb = table.Column<int>(type: "integer", nullable: false),
                    ModelName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_computer_storages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_computer_storages_computers_ComputerId",
                        column: x => x.ComputerId,
                        principalTable: "computers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "computer_transfer_requests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    ComputerId = table.Column<Guid>(type: "uuid", nullable: false),
                    FromUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ToUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    RequestedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false, defaultValue: "PendingStorekeeper"),
                    StorekeeperId = table.Column<Guid>(type: "uuid", nullable: true),
                    StorekeeperActionAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    StorekeeperNote = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    ReceiverActionAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ReceiverNote = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Reason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_computer_transfer_requests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_computer_transfer_requests_computers_ComputerId",
                        column: x => x.ComputerId,
                        principalTable: "computers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_computer_transfer_requests_users_FromUserId",
                        column: x => x.FromUserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_computer_transfer_requests_users_RequestedByUserId",
                        column: x => x.RequestedByUserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_computer_transfer_requests_users_StorekeeperId",
                        column: x => x.StorekeeperId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_computer_transfer_requests_users_ToUserId",
                        column: x => x.ToUserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "computer_transfer_histories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    ComputerId = table.Column<Guid>(type: "uuid", nullable: false),
                    FromUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    ToUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    TransferredAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ApprovedByStorekeeperId = table.Column<Guid>(type: "uuid", nullable: false),
                    RequestId = table.Column<Guid>(type: "uuid", nullable: false),
                    Note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_computer_transfer_histories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_computer_transfer_histories_computer_transfer_requests_Requ~",
                        column: x => x.RequestId,
                        principalTable: "computer_transfer_requests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_computer_transfer_histories_computers_ComputerId",
                        column: x => x.ComputerId,
                        principalTable: "computers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_computer_transfer_histories_users_ApprovedByStorekeeperId",
                        column: x => x.ApprovedByStorekeeperId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_computer_transfer_histories_users_FromUserId",
                        column: x => x.FromUserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_computer_transfer_histories_users_ToUserId",
                        column: x => x.ToUserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_computer_images_ComputerId",
                table: "computer_images",
                column: "ComputerId");

            migrationBuilder.CreateIndex(
                name: "IX_computer_storages_ComputerId",
                table: "computer_storages",
                column: "ComputerId");

            migrationBuilder.CreateIndex(
                name: "IX_computer_transfer_histories_ApprovedByStorekeeperId",
                table: "computer_transfer_histories",
                column: "ApprovedByStorekeeperId");

            migrationBuilder.CreateIndex(
                name: "IX_computer_transfer_histories_ComputerId_TransferredAt",
                table: "computer_transfer_histories",
                columns: new[] { "ComputerId", "TransferredAt" });

            migrationBuilder.CreateIndex(
                name: "IX_computer_transfer_histories_FromUserId",
                table: "computer_transfer_histories",
                column: "FromUserId");

            migrationBuilder.CreateIndex(
                name: "IX_computer_transfer_histories_RequestId",
                table: "computer_transfer_histories",
                column: "RequestId");

            migrationBuilder.CreateIndex(
                name: "IX_computer_transfer_histories_ToUserId",
                table: "computer_transfer_histories",
                column: "ToUserId");

            migrationBuilder.CreateIndex(
                name: "IX_computer_transfer_requests_ComputerId",
                table: "computer_transfer_requests",
                column: "ComputerId");

            migrationBuilder.CreateIndex(
                name: "IX_computer_transfer_requests_FromUserId",
                table: "computer_transfer_requests",
                column: "FromUserId");

            migrationBuilder.CreateIndex(
                name: "IX_computer_transfer_requests_RequestedByUserId",
                table: "computer_transfer_requests",
                column: "RequestedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_computer_transfer_requests_Status_CreatedAt",
                table: "computer_transfer_requests",
                columns: new[] { "Status", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_computer_transfer_requests_StorekeeperId",
                table: "computer_transfer_requests",
                column: "StorekeeperId");

            migrationBuilder.CreateIndex(
                name: "IX_computer_transfer_requests_ToUserId",
                table: "computer_transfer_requests",
                column: "ToUserId");

            migrationBuilder.CreateIndex(
                name: "IX_computers_AssetCode",
                table: "computers",
                column: "AssetCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_computers_CompanyId",
                table: "computers",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_computers_CompanyId_Status",
                table: "computers",
                columns: new[] { "CompanyId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_computers_MacAddress",
                table: "computers",
                column: "MacAddress",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_computers_OwnerUserId",
                table: "computers",
                column: "OwnerUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "computer_images");

            migrationBuilder.DropTable(
                name: "computer_storages");

            migrationBuilder.DropTable(
                name: "computer_transfer_histories");

            migrationBuilder.DropTable(
                name: "computer_transfer_requests");

            migrationBuilder.DropTable(
                name: "computers");
        }
    }
}
