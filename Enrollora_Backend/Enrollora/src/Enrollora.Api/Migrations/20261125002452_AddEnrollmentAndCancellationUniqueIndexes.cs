using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Enrollora.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddEnrollmentAndCancellationUniqueIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Enrollments_StudentId_CourseId_Status",
                table: "Enrollments");

            migrationBuilder.DropIndex(
                name: "IX_CancellationRequests_EnrollmentId_Status",
                table: "CancellationRequests");

            migrationBuilder.CreateIndex(
                name: "IX_Enrollments_StudentId_CourseId",
                table: "Enrollments",
                columns: new[] { "StudentId", "CourseId" },
                unique: true,
                filter: "[Status] = 0");

            migrationBuilder.CreateIndex(
                name: "IX_CancellationRequests_EnrollmentId",
                table: "CancellationRequests",
                column: "EnrollmentId",
                unique: true,
                filter: "[Status] = 0");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Enrollments_StudentId_CourseId",
                table: "Enrollments");

            migrationBuilder.DropIndex(
                name: "IX_CancellationRequests_EnrollmentId",
                table: "CancellationRequests");

            migrationBuilder.CreateIndex(
                name: "IX_Enrollments_StudentId_CourseId_Status",
                table: "Enrollments",
                columns: new[] { "StudentId", "CourseId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_CancellationRequests_EnrollmentId_Status",
                table: "CancellationRequests",
                columns: new[] { "EnrollmentId", "Status" });
        }
    }
}
