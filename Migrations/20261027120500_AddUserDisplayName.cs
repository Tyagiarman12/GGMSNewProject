using System;
using GGMSNEWPROJECT.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GGMSNEWPROJECT.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20261027120500_AddUserDisplayName")]
    public partial class AddUserDisplayName : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Name",
                table: "Users",
                type: "TEXT",
                nullable: false,
                defaultValue: "");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Name",
                table: "Users");
        }

        protected override void BuildTargetModel(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity("GGMSNEWPROJECT.Models.User", entity =>
            {
                entity.Property<int>("Id")
                    .ValueGeneratedOnAdd()
                    .HasColumnType("INTEGER");
                entity.Property<string>("Email")
                    .IsRequired()
                    .HasColumnType("TEXT");
                entity.Property<string>("Name")
                    .IsRequired()
                    .HasColumnType("TEXT");
                entity.Property<string>("PasswordHash")
                    .IsRequired()
                    .HasColumnType("TEXT");
                entity.Property<string>("Role")
                    .IsRequired()
                    .HasColumnType("TEXT");
                entity.Property<bool>("IsActive")
                    .HasColumnType("INTEGER");
                entity.Property<DateTime>("CreatedAt")
                    .HasColumnType("TEXT");
                entity.Property<DateTime?>("LastLoginAt")
                    .HasColumnType("TEXT");
                entity.HasKey("Id");
                entity.ToTable("Users");
            });
        }
    }
}
