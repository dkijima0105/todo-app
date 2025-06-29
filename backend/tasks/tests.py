from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from .models import Task


class TaskModelTest(TestCase):
    """Task モデルのテスト"""

    def setUp(self):
        self.task = Task.objects.create(
            title="テストタスク", description="テスト用の説明", urgency="urgent", importance="important"
        )

    def test_task_creation(self):
        """タスクが正常に作成されることをテスト"""
        self.assertEqual(self.task.title, "テストタスク")
        self.assertEqual(self.task.description, "テスト用の説明")
        self.assertEqual(self.task.urgency, "urgent")
        self.assertEqual(self.task.importance, "important")
        self.assertFalse(self.task.completed)

    def test_task_str_representation(self):
        """タスクの文字列表現をテスト"""
        expected = "テストタスク (緊急度: 緊急)"
        self.assertEqual(str(self.task), expected)

    def test_task_estimated_hours_display(self):
        """作業時間見積もりの表示をテスト"""
        self.task.estimated_hours = 2.0
        self.task.save()
        self.assertEqual(self.task.estimated_hours_display, "2時間")

    def test_eisenhower_quadrant(self):
        """アイゼンハウワーマトリクスの象限をテスト"""
        # 第1象限: 緊急かつ重要
        self.task.urgency = "urgent"
        self.task.importance = "important"
        self.assertEqual(self.task.eisenhower_quadrant, 1)

        # 第2象限: 重要だが緊急ではない
        self.task.urgency = "not_urgent"
        self.task.importance = "important"
        self.assertEqual(self.task.eisenhower_quadrant, 2)

        # 第3象限: 緊急だが重要ではない
        self.task.urgency = "urgent"
        self.task.importance = "not_important"
        self.assertEqual(self.task.eisenhower_quadrant, 3)

        # 第4象限: 緊急でも重要でもない
        self.task.urgency = "not_urgent"
        self.task.importance = "not_important"
        self.assertEqual(self.task.eisenhower_quadrant, 4)


class TaskAPITest(APITestCase):
    """Task API のテスト"""

    def setUp(self):
        self.task_data = {
            "title": "APIテストタスク",
            "description": "API用のテスト説明",
            "urgency": "urgent",
            "importance": "important",
        }
        self.task = Task.objects.create(**self.task_data)

    def test_get_task_list(self):
        """タスク一覧取得のテスト"""
        url = reverse("task-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # レスポンスがページネーションされている場合の処理
        if isinstance(response.data, dict) and "results" in response.data:
            tasks = response.data["results"]
        else:
            tasks = response.data

        # 作成したタスクが含まれることを確認
        self.assertGreaterEqual(len(tasks), 1)
        task_titles = [task["title"] for task in tasks]
        self.assertIn("APIテストタスク", task_titles)

    def test_create_task(self):
        """タスク作成のテスト"""
        url = reverse("task-list")
        new_task_data = {
            "title": "新しいタスク",
            "description": "新しい説明",
            "urgency": "not_urgent",
            "importance": "not_important",
        }
        initial_count = Task.objects.count()
        response = self.client.post(url, new_task_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Task.objects.count(), initial_count + 1)

    def test_get_task_detail(self):
        """タスク詳細取得のテスト"""
        url = reverse("task-detail", kwargs={"pk": self.task.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], self.task_data["title"])

    def test_update_task(self):
        """タスク更新のテスト"""
        url = reverse("task-detail", kwargs={"pk": self.task.pk})
        updated_data = {
            "title": "更新されたタスク",
            "description": "更新された説明",
            "urgency": "not_urgent",
            "importance": "important",
        }
        response = self.client.put(url, updated_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.task.refresh_from_db()
        self.assertEqual(self.task.title, "更新されたタスク")

    def test_delete_task(self):
        """タスク削除のテスト"""
        task_id = self.task.pk
        url = reverse("task-detail", kwargs={"pk": task_id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Task.objects.filter(pk=task_id).count(), 0)

    def test_toggle_task_completion(self):
        """タスク完了状態切り替えのテスト"""
        url = reverse("task-toggle-completed", kwargs={"pk": self.task.pk})
        response = self.client.patch(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.task.refresh_from_db()
        self.assertTrue(self.task.completed)


class TaskFilterTest(APITestCase):
    """タスクフィルタリングのテスト"""

    def setUp(self):
        # 完了済みタスク
        self.completed_task = Task.objects.create(
            title="完了済みタスク", urgency="urgent", importance="important", completed=True
        )
        # 未完了タスク
        self.pending_task = Task.objects.create(
            title="未完了タスク", urgency="not_urgent", importance="not_important", completed=False
        )

    def test_completed_tasks_filter(self):
        """完了済みタスクのフィルタリングをテスト"""
        url = reverse("task-completed")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # レスポンスがページネーションされている場合の処理
        if isinstance(response.data, dict) and "results" in response.data:
            tasks = response.data["results"]
        else:
            tasks = response.data

        # 完了済みタスクが含まれることを確認
        completed_titles = [task["title"] for task in tasks]
        self.assertIn("完了済みタスク", completed_titles)
        # 未完了タスクは含まれないことを確認
        self.assertNotIn("未完了タスク", completed_titles)

    def test_pending_tasks_filter(self):
        """未完了タスクのフィルタリングをテスト"""
        url = reverse("task-pending")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # レスポンスがページネーションされている場合の処理
        if isinstance(response.data, dict) and "results" in response.data:
            tasks = response.data["results"]
        else:
            tasks = response.data

        # 未完了タスクが含まれることを確認
        pending_titles = [task["title"] for task in tasks]
        self.assertIn("未完了タスク", pending_titles)
        # 完了済みタスクは含まれないことを確認
        self.assertNotIn("完了済みタスク", pending_titles)
