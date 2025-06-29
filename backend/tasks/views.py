from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Task
from .serializers import TaskSerializer, TaskCreateSerializer


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()

    def get_serializer_class(self):
        if self.action == "create":
            return TaskCreateSerializer
        return TaskSerializer

    def get_queryset(self):
        queryset = Task.objects.all()

        # フィルタリング
        completed = self.request.query_params.get("completed")
        if completed is not None:
            queryset = queryset.filter(completed=completed.lower() == "true")

        # 緊急度でフィルタリング
        urgency = self.request.query_params.get("urgency")
        if urgency:
            queryset = queryset.filter(urgency=urgency)

        # 重要度でフィルタリング
        importance = self.request.query_params.get("importance")
        if importance:
            queryset = queryset.filter(importance=importance)

        # アイゼンハウワーマトリクスの象限でフィルタリング
        quadrant = self.request.query_params.get("quadrant")
        if quadrant:
            try:
                quadrant_num = int(quadrant)
                if quadrant_num == 1:
                    # 緊急かつ重要
                    queryset = queryset.filter(urgency="high", importance="high")
                elif quadrant_num == 2:
                    # 重要だが緊急ではない
                    queryset = queryset.filter(
                        urgency__in=["low", "medium"], importance="high"
                    )
                elif quadrant_num == 3:
                    # 緊急だが重要ではない
                    queryset = queryset.filter(
                        urgency="high", importance__in=["low", "medium"]
                    )
                elif quadrant_num == 4:
                    # 緊急でも重要でもない
                    queryset = queryset.filter(
                        urgency__in=["low", "medium"], importance__in=["low", "medium"]
                    )
            except ValueError:
                pass

        # ソート
        sort_by = self.request.query_params.get("sort")
        if sort_by == "urgency":
            queryset = queryset.order_by("-urgency", "-importance")
        elif sort_by == "importance":
            queryset = queryset.order_by("-importance", "-urgency")
        elif sort_by == "due_date":
            queryset = queryset.order_by("due_date")
        elif sort_by == "created_at":
            queryset = queryset.order_by("-created_at")
        elif sort_by == "eisenhower":
            # アイゼンハウワーマトリクス順（第1象限から第4象限）
            queryset = queryset.order_by("-urgency", "-importance")

        return queryset

    @action(detail=False, methods=["get"])
    def overdue(self, request):
        """期限切れのタスクを取得"""
        overdue_tasks = Task.objects.filter(
            due_date__lt=timezone.now(), completed=False
        )
        serializer = self.get_serializer(overdue_tasks, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def urgent(self, request):
        """緊急度が高いタスクを取得"""
        urgent_tasks = Task.objects.filter(urgency="high")
        serializer = self.get_serializer(urgent_tasks, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def critical(self, request):
        """重要度が高いタスクを取得"""
        critical_tasks = Task.objects.filter(importance="high")
        serializer = self.get_serializer(critical_tasks, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def eisenhower_matrix(self, request):
        """アイゼンハウワーマトリクスの各象限のタスクを取得"""
        quadrant_1 = Task.objects.filter(urgency="high", importance="high")
        quadrant_2 = Task.objects.filter(
            urgency__in=["low", "medium"], importance="high"
        )
        quadrant_3 = Task.objects.filter(
            urgency="high", importance__in=["low", "medium"]
        )
        quadrant_4 = Task.objects.filter(
            urgency__in=["low", "medium"], importance__in=["low", "medium"]
        )

        data = {
            "quadrant_1": self.get_serializer(quadrant_1, many=True).data,
            "quadrant_2": self.get_serializer(quadrant_2, many=True).data,
            "quadrant_3": self.get_serializer(quadrant_3, many=True).data,
            "quadrant_4": self.get_serializer(quadrant_4, many=True).data,
        }
        return Response(data)

    @action(detail=True, methods=["patch"])
    def toggle_completed(self, request, pk=None):
        """タスクの完了状態を切り替える"""
        task = self.get_object()
        task.completed = not task.completed
        task.save()
        serializer = self.get_serializer(task)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def completed(self, request):
        """完了したタスクのみを取得"""
        completed_tasks = Task.objects.filter(completed=True)
        serializer = self.get_serializer(completed_tasks, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def pending(self, request):
        """未完了のタスクのみを取得"""
        pending_tasks = Task.objects.filter(completed=False)
        serializer = self.get_serializer(pending_tasks, many=True)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        """タスク作成時に各象限の上限（10個）をチェック"""
        data = request.data
        urgency = data.get("urgency", "not_urgent")
        importance = data.get("importance", "not_important")

        # 同じ象限の未完了タスク数をカウント
        existing_count = Task.objects.filter(
            urgency=urgency, importance=importance, completed=False
        ).count()

        if existing_count >= 10:
            # 象限の日本語名を取得
            quadrant_name = self.get_quadrant_name(urgency, importance)
            error_message = (
                f"{quadrant_name}は既に10個のタスクがあります。"
                "完了するか削除してから新しいタスクを追加してください。"
            )
            return Response(
                {
                    "error": error_message,
                    "quadrant": quadrant_name,
                    "current_count": existing_count,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return super().create(request, *args, **kwargs)

    def get_quadrant_name(self, urgency, importance):
        """象限名を取得"""
        if urgency == "urgent" and importance == "important":
            return "第1象限（緊急 & 重要）"
        elif urgency == "not_urgent" and importance == "important":
            return "第2象限（重要だが緊急ではない）"
        elif urgency == "urgent" and importance == "not_important":
            return "第3象限（緊急だが重要ではない）"
        else:
            return "第4象限（緊急でも重要でもない）"
