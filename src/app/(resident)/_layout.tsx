import { Tabs } from 'expo-router';

import {
  hiddenTabOptions,
  roleTabIcon,
  useRoleTabScreenOptions,
} from '@/components/role-tabs';

export default function ResidentLayout() {
  const { screenOptions, insets } = useRoleTabScreenOptions('resident');

  return (
    <Tabs screenOptions={screenOptions} safeAreaInsets={insets}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: roleTabIcon('home', 'home-outline'),
        }}
      />
      <Tabs.Screen
        name="visitors"
        options={{
          title: 'Visitors',
          tabBarIcon: roleTabIcon('people', 'people-outline'),
        }}
      />
      <Tabs.Screen
        name="notices"
        options={{
          title: 'Notices',
          tabBarIcon: roleTabIcon('megaphone', 'megaphone-outline'),
        }}
      />
      <Tabs.Screen
        name="polls"
        options={{
          title: 'Polls',
          tabBarIcon: roleTabIcon('stats-chart', 'stats-chart-outline'),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: roleTabIcon('person', 'person-outline'),
        }}
      />
      <Tabs.Screen name="household" options={hiddenTabOptions} />
      <Tabs.Screen name="complaints" options={hiddenTabOptions} />
      <Tabs.Screen name="staff" options={hiddenTabOptions} />
      <Tabs.Screen name="pre-approvals" options={hiddenTabOptions} />
    </Tabs>
  );
}
