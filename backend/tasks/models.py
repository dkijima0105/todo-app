from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.conf import settings
import pytz


class Task(models.Model):
    # 緊急度の選択肢（アイゼンハウワーマトリクス用）
    URGENCY_CHOICES = [
        ("urgent", "緊急"),
        ("not_urgent", "緊急ではない"),
    ]

    # 重要度の選択肢
    IMPORTANCE_CHOICES = [
        ("important", "重要"),
        ("not_important", "重要ではない"),
    ]

    title = models.CharField(max_length=200, verbose_name="タイトル")
    description = models.TextField(blank=True, verbose_name="説明")
    completed = models.BooleanField(default=False, verbose_name="完了")

    # 緊急度フィールド（優先度から変更）
    urgency = models.CharField(
        max_length=15,
        choices=URGENCY_CHOICES,
        default="not_urgent",
        verbose_name="緊急度",
    )
    importance = models.CharField(
        max_length=15,
        choices=IMPORTANCE_CHOICES,
        default="not_important",
        verbose_name="重要度",
    )
    due_date = models.DateTimeField(null=True, blank=True, verbose_name="期限")

    # 終日フラグ
    is_all_day = models.BooleanField(default=False, verbose_name="終日")

    # 想定作業時間フィールド
    estimated_hours = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="想定作業時間（時間）",
        help_text="想定作業時間を時間単位で入力",
    )

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="作成日時")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新日時")
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name="ユーザー",
    )

    class Meta:
        ordering = ["-urgency", "-importance", "due_date", "-created_at"]
        verbose_name = "タスク"
        verbose_name_plural = "タスク"

    def __str__(self):
        return f"{self.title} (緊急度: {self.get_urgency_display()})"

    @property
    def is_overdue(self):
        """期限切れかどうかを判定"""
        if self.due_date and not self.completed:
            now = timezone.now()

            if self.is_all_day:
                # 終日タスクの場合：現地時間で日付を比較
                # 設定されたタイムゾーンで比較
                local_tz = pytz.timezone(settings.TIME_ZONE)
                now_local = now.astimezone(local_tz)
                due_local = self.due_date.astimezone(local_tz)

                # 現地時間で日付のみ比較
                return now_local.date() > due_local.date()
            else:
                # 通常タスクの場合：時刻も含めて比較
                return now > self.due_date
        return False

    @property
    def urgency_weight(self):
        """緊急度の重み（ソート用）"""
        weights = {"not_urgent": 1, "urgent": 2}
        return weights.get(self.urgency, 1)

    @property
    def importance_weight(self):
        """重要度の重み（ソート用）"""
        weights = {"not_important": 1, "important": 2}
        return weights.get(self.importance, 1)

    @property
    def eisenhower_quadrant(self):
        """アイゼンハウワーマトリクスの象限を返す"""
        urgency_high = self.urgency == "urgent"
        importance_high = self.importance == "important"

        if urgency_high and importance_high:
            return 1  # 緊急かつ重要（すぐやる）
        elif not urgency_high and importance_high:
            return 2  # 重要だが緊急ではない（計画的にやる）
        elif urgency_high and not importance_high:
            return 3  # 緊急だが重要ではない（委任する）
        else:
            return 4  # 緊急でも重要でもない（やらない）

    @property
    def estimated_hours_display(self):
        """想定作業時間の表示用文字列"""
        if self.estimated_hours:
            hours = int(self.estimated_hours)
            minutes = int((self.estimated_hours % 1) * 60)
            if hours > 0 and minutes > 0:
                return f"{hours}時間{minutes}分"
            elif hours > 0:
                return f"{hours}時間"
            elif minutes > 0:
                return f"{minutes}分"
        return None
