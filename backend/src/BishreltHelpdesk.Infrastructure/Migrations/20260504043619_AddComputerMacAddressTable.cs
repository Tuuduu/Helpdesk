using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BishreltHelpdesk.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddComputerMacAddressTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Шинэ хүснэгт үүсгэх
            migrationBuilder.CreateTable(
                name: "computer_mac_addresses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    ComputerId = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Address = table.Column<string>(type: "character varying(17)", maxLength: 17, nullable: false),
                    Label = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    IsPrimary = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_computer_mac_addresses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_computer_mac_addresses_computers_ComputerId",
                        column: x => x.ComputerId,
                        principalTable: "computers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            // 2. Хуучин MacAddress өгөгдлийг шинэ хүснэгт рүү шилжүүлэх
            //    (одоо байгаа компьютер бүрд "Lan" төрөлтэй, IsPrimary=true гэсэн entry үүсэнэ)
            migrationBuilder.Sql(@"
                INSERT INTO computer_mac_addresses (""Id"", ""ComputerId"", ""Type"", ""Address"", ""IsPrimary"")
                SELECT gen_random_uuid(), ""Id"", 'Lan', ""MacAddress"", true
                FROM computers
                WHERE ""MacAddress"" IS NOT NULL AND ""MacAddress"" <> '';
            ");

            // 3. Indexes (өгөгдөл шилжсэний дараа unique index үүсгэхэд аюулгүй)
            migrationBuilder.CreateIndex(
                name: "IX_computer_mac_addresses_Address",
                table: "computer_mac_addresses",
                column: "Address",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_computer_mac_addresses_ComputerId",
                table: "computer_mac_addresses",
                column: "ComputerId");

            // 4. Хуучин баганыг устгах
            migrationBuilder.DropIndex(
                name: "IX_computers_MacAddress",
                table: "computers");

            migrationBuilder.DropColumn(
                name: "MacAddress",
                table: "computers");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "computer_mac_addresses");

            migrationBuilder.AddColumn<string>(
                name: "MacAddress",
                table: "computers",
                type: "character varying(17)",
                maxLength: 17,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_computers_MacAddress",
                table: "computers",
                column: "MacAddress",
                unique: true);
        }
    }
}
