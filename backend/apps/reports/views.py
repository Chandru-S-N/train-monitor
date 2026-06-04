from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from apps.users.permissions import IsAdminOrOperator
from .generators import generate_pdf_report, generate_excel_report

class GenerateReportView(APIView):
    permission_classes = [IsAdminOrOperator]

    def get(self, request):
        report_type = request.query_params.get('type', 'daily')  # daily, weekly, monthly
        report_format = request.query_params.get('file_format', request.query_params.get('format', 'pdf'))  # pdf, excel
        train_id = request.query_params.get('train_id', None)
        
        # Determine days duration
        days = 1
        if report_type == 'weekly':
            days = 7
        elif report_type == 'monthly':
            days = 30
            
        if report_format == 'excel':
            excel_data = generate_excel_report(report_type, train_id, days)
            response = HttpResponse(
                excel_data,
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            filename = f"train_report_{report_type}_{timezone_now_str()}.xlsx"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
        else:
            pdf_data = generate_pdf_report(report_type, train_id, days)
            response = HttpResponse(pdf_data, content_type='application/pdf')
            filename = f"train_report_{report_type}_{timezone_now_str()}.pdf"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response

def timezone_now_str():
    from django.utils import timezone
    return timezone.now().strftime('%Y%m%d_%H%M%S')
