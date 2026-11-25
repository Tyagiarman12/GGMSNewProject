using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GGMSNEWPROJECT.Migrations
{
    /// <inheritdoc />
    public partial class AddSupplierPaymentsAndBillDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "InvoiceDate",
                table: "Bills",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "InvoiceNumber",
                table: "Bills",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ReceiptUrl",
                table: "Bills",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SupplierVat",
                table: "Bills",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "Vat",
                table: "Bills",
                type: "TEXT",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateTable(
                name: "SupplierPayments",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    CompanyId = table.Column<string>(type: "TEXT", nullable: false),
                    BillId = table.Column<string>(type: "TEXT", nullable: false),
                    Supplier = table.Column<string>(type: "TEXT", nullable: false),
                    Amount = table.Column<decimal>(type: "TEXT", nullable: false),
                    Method = table.Column<string>(type: "TEXT", nullable: false),
                    Reference = table.Column<string>(type: "TEXT", nullable: false),
                    PaymentDate = table.Column<string>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SupplierPayments", x => x.Id);
                });

            migrationBuilder.UpdateData(
                table: "Bills",
                keyColumn: "Id",
                keyValue: "BILL-771",
                columns: new[] { "InvoiceDate", "InvoiceNumber", "ReceiptUrl", "SupplierVat", "Vat" },
                values: new object[] { "", "", "", "", 0m });

            migrationBuilder.UpdateData(
                table: "Bills",
                keyColumn: "Id",
                keyValue: "BILL-774",
                columns: new[] { "InvoiceDate", "InvoiceNumber", "ReceiptUrl", "SupplierVat", "Vat" },
                values: new object[] { "", "", "", "", 0m });

            migrationBuilder.UpdateData(
                table: "Bills",
                keyColumn: "Id",
                keyValue: "BILL-779",
                columns: new[] { "InvoiceDate", "InvoiceNumber", "ReceiptUrl", "SupplierVat", "Vat" },
                values: new object[] { "", "", "", "", 0m });

        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SupplierPayments");

            migrationBuilder.DropColumn(
                name: "InvoiceDate",
                table: "Bills");

            migrationBuilder.DropColumn(
                name: "InvoiceNumber",
                table: "Bills");

            migrationBuilder.DropColumn(
                name: "ReceiptUrl",
                table: "Bills");

            migrationBuilder.DropColumn(
                name: "SupplierVat",
                table: "Bills");

            migrationBuilder.DropColumn(
                name: "Vat",
                table: "Bills");

        }
    }
}
