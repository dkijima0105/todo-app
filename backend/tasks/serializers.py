from rest_framework import serializers
from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    # 追加のプロパティを含める
    is_overdue = serializers.ReadOnlyField()
    urgency_weight = serializers.ReadOnlyField()
    importance_weight = serializers.ReadOnlyField()
    eisenhower_quadrant = serializers.ReadOnlyField()
    estimated_hours_display = serializers.ReadOnlyField()

    # 選択肢を表示用に含める
    urgency_display = serializers.CharField(
        source="get_urgency_display", read_only=True
    )
    importance_display = serializers.CharField(
        source="get_importance_display", read_only=True
    )

    class Meta:
        model = Task
        fields = [
            "id",
            "title",
            "description",
            "completed",
            "urgency",
            "urgency_display",
            "importance",
            "importance_display",
            "due_date",
            "is_all_day",
            "estimated_hours",
            "estimated_hours_display",
            "is_overdue",
            "urgency_weight",
            "importance_weight",
            "eisenhower_quadrant",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "is_overdue",
            "urgency_weight",
            "importance_weight",
            "urgency_display",
            "importance_display",
            "estimated_hours_display",
            "eisenhower_quadrant",
        ]


class TaskCreateSerializer(serializers.ModelSerializer):
    """タスク作成用の簡潔なシリアライザー"""

    class Meta:
        model = Task
        fields = [
            "title",
            "description",
            "urgency",
            "importance",
            "due_date",
            "estimated_hours",
            "is_all_day",
        ]
