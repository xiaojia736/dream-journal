# 星海日记 Flutter

星海日记的 Flutter 移动端，支持 Android 和 iOS。应用默认离线运行，数据保存在本机 SQLite 与应用私有文件目录中。

## 功能

- 创建、编辑、搜索和删除生活、梦境、日记与内心记录
- 情绪、标签、日期时间与每条最多五张照片
- 记录统计、连续记录天数与最近 28 天活跃图
- 深浅色主题与四位数字隐私锁
- 包含照片的 JSON 备份导入与导出

## 开发

```bash
flutter pub get
flutter run
```

## 检查和构建

```bash
flutter analyze
flutter test
flutter build apk --release
```

应用标识为 `com.starsea.journal`，最低支持 Android 7.0（API 24）。
