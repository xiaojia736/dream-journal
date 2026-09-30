# 星海日记

星海日记是一款可以离线使用的 Android/iOS 记录应用。生活点滴、梦境和心情都可以写下来，也可以直接用相册照片或拍照记录。当前手机端使用 Flutter 实现，不需要账号、电脑或服务端。

## 安装到 Android 手机

仓库保存应用源码与配置，不包含 APK 或本机编译缓存。Flutter 工程位于 `flutter_app/`，应用包名为 `com.starsea.journal`。

## 可以做什么

- 记录生活、梦境、日记和内心想法；添加发生日期、时间、情绪及标签。
- 从本地相册选图或直接拍照，每条记录最多保存 5 张照片；也能只用照片创建记录。
- 浏览、搜索、编辑和删除记录，查看回顾及统计。
- 使用深浅色外观与四位数字隐私锁。
- 导入 Flutter 版 JSON 备份，或导出包含照片的完整 JSON 备份。

记录存放在手机的应用私有空间。换手机或卸载应用前，请在“设置 → 导出完整备份”保存备份；卸载可能清除本机数据。备份文件含私人文字和照片，请妥善保管。新手机安装应用后，在“设置 → 导入备份”选择该文件即可合并记录；相同编号的记录会跳过。

## 开发与构建

需要 Flutter 3.44 或更高版本。手机应用在 `flutter_app/`：

```bash
cd flutter_app
flutter pub get
flutter run
```

运行质量检查并构建 Android 安装包：

```bash
flutter analyze
flutter test
flutter build apk --release
```

Android 产物位于 `flutter_app/build/app/outputs/flutter-apk/`。iOS 可通过 `flutter run` 在模拟器或真机调试，并使用 Xcode 配置签名后发布。原 React Native/Expo 代码暂时保留在 `mobile/`，仅作为迁移期间的界面和功能参考。

仓库中的 `server/` 是早期本地 Node.js + SQLite 后端原型，供之后需要服务端同步时继续开发；当前 Android 应用离线保存数据，不调用它。后端可用 `cd server; npm test` 测试。
