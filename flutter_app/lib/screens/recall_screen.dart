import 'package:flutter/material.dart';

import '../state/app_state_scope.dart';
import '../theme/app_theme.dart';
import '../utils/date_text.dart';
import '../widgets/gradient_background.dart';
import '../widgets/journal_record_card.dart';
import 'entry_detail_screen.dart';

class RecallScreen extends StatefulWidget {
  const RecallScreen({super.key, required this.initialDate});

  final DateTime initialDate;

  @override
  State<RecallScreen> createState() => _RecallScreenState();
}

class _RecallScreenState extends State<RecallScreen> {
  final _scroll = ScrollController();
  late final DateTime _day;

  @override
  void initState() {
    super.initState();
    _day = widget.initialDate;
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final records = AppStateScope.of(context).entries
        .where((entry) => dayKey(entry.occurredAt.toLocal()) == dayKey(_day))
        .toList()
      ..sort((a, b) => a.occurredAt.compareTo(b.occurredAt));
    return GradientBackground(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        body: SafeArea(
          child: Column(
            children: [
              Align(
                alignment: Alignment.centerLeft,
                child: Padding(
                  padding: const EdgeInsets.only(left: 8),
                  child: IconButton(
                    tooltip: '返回',
                    color: AppColors.heading(context),
                    icon: const Icon(Icons.arrow_back_rounded, size: 22),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ),
              ),
              Expanded(
                child: ListView.builder(
                  controller: _scroll,
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
                  itemCount: records.length,
                  itemBuilder: (context, index) => JournalRecordCard(
                    entry: records[index],
                    fullContent: true,
                    onTap: () => Navigator.of(context).push<void>(
                      MaterialPageRoute(
                        builder: (_) => EntryDetailScreen(
                          entryId: records[index].id,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
