# 星海日记

星海日记是一款可以离线使用的 Android 记录应用。生活点滴、梦境和心情都可以写下来，也可以直接用相册照片或拍照记录。手机端使用 React Native 原生界面，不需要账号、电脑或服务端。

## 安装到 Android 手机

仓库保存应用源码与配置，不包含 APK 或本机编译缓存。已在本机生成的安装包位于 `mobile/release/星海日记-android.apk`，不会随源码上传。把 APK 发送到手机并打开，按系统提示允许从该来源安装即可。应用包名为 `com.starsea.journal`。

## 可以做什么

- 记录生活、梦境、日记和内心想法；添加发生日期、时间、情绪及标签。
- 从本地相册选图或直接拍照，每条记录最多保存 5 张照片；也能只用照片创建记录。
- 浏览、搜索、编辑和删除记录，查看回顾及统计。
- 使用深浅色外观与四位数字隐私锁。
- 导入旧网页版 JSON，或导出包含照片的完整 JSON 备份。

记录存放在手机的应用私有空间。换手机或卸载应用前，请在“设置 → 导出完整备份”保存备份；卸载可能清除本机数据。备份文件含私人文字和照片，请妥善保管。新手机安装应用后，在“设置 → 导入备份”选择该文件即可合并记录；相同编号的记录会跳过。

## 从旧网页版迁移

在旧网页“设置”中选择“导出数据”，得到 `dream_diary_backup_*.json`。把文件传到手机，在星海日记“设置 → 导入备份”中选择它。旧网页版代码保留在仓库根目录，供查看和导出原有数据。

## 开发与构建

需要 Node.js、JDK 17 和 Android SDK。手机应用在 `mobile/`：

```powershell
cd mobile
npm install
npx expo start
```

本地 Android 构建使用 Expo 生成的原生工程：

```powershell
cd mobile
npx expo prebuild --platform android
cd android
.\gradlew.bat assembleRelease
```

Gradle 的原始产物位于 `mobile/android/app/build/outputs/apk/release/`；交付安装包可复制到 `mobile/release/`。这些目录均不提交到 GitHub。`mobile/android/` 是自动生成目录，不要手动修改。可运行 `npx tsc --noEmit`、`npx expo lint` 和 `npx expo-doctor` 检查手机应用。`mobile/eas.json` 也提供了手动触发的云端 APK 构建配置。

仓库中的 `server/` 是早期本地 Node.js + SQLite 后端原型，供之后需要服务端同步时继续开发；当前 Android 应用离线保存数据，不调用它。后端可用 `cd server; npm test` 测试。
