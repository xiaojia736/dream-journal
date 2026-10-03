const int maxEntryPhotos = 9;

bool isEntryPhotoCountAllowed(int count) => count >= 0 && count <= maxEntryPhotos;

int remainingEntryPhotoSlots(int count) =>
    (maxEntryPhotos - count).clamp(0, maxEntryPhotos).toInt();
