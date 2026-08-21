import React from 'react';
import { View } from 'react-native';

import styles from '../index.styles';

export const OpportunitySkeletonCard = () => (
  <View style={styles.cardWrapper}>
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <View style={[styles.skeletonLine, { width: '60%', height: 16, marginBottom: 8 }]} />
          <View style={[styles.skeletonLine, { width: '80%', height: 13 }]} />
        </View>
        <View style={[styles.skeletonLine, { width: 72, height: 28, borderRadius: 10 }]} />
      </View>
      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <View style={[styles.skeletonLine, { flex: 1, height: 12, marginRight: 8 }]} />
          <View style={[styles.skeletonLine, { flex: 1, height: 12 }]} />
        </View>
        <View style={styles.infoRow}>
          <View style={[styles.skeletonLine, { flex: 1, height: 12, marginRight: 8 }]} />
          <View style={[styles.skeletonLine, { flex: 1, height: 12 }]} />
        </View>
      </View>
      <View style={[styles.actionContainer, { marginTop: 12 }]}>
        <View style={[styles.skeletonLine, { flex: 1, height: 40, borderRadius: 12 }]} />
        <View style={[styles.skeletonLine, { flex: 1, height: 40, borderRadius: 12 }]} />
      </View>
    </View>
  </View>
);

export const CrmTopSkeleton = () => (
  <View style={styles.subHeader}>
    <View style={styles.searchRow}>
      <View style={[styles.skeletonLine, styles.searchSkeletonInput]} />
      <View style={[styles.skeletonLine, styles.searchSkeletonButton]} />
    </View>

    <View style={styles.statusFilterSection}>
      <View style={[styles.skeletonLine, styles.statusLabelSkeleton]} />
      <View style={styles.statusSkeletonRow}>
        {[1, 2, 3, 4].map(key => (
          <View
            key={key}
            style={[styles.skeletonLine, styles.statusChipSkeleton]}
          />
        ))}
      </View>
    </View>
  </View>
);
